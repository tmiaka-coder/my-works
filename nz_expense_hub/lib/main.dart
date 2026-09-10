import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'ocr_service.dart';
import 'firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp(options: firebaseOptions);
    FirebaseFirestore.instance.settings = const Settings(
      persistenceEnabled: true,
      cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
    );
  } catch (_) {
    // Firebase is optional at startup so the cached/local UI still opens offline.
  }
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NZ Expense Hub',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xff087f5b),
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: const Color(0xfff4f8f7),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xff073b4c),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xffd7e3e0)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xffd7e3e0)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xff087f5b), width: 2),
          ),
        ),
        useMaterial3: true,
      ),
      home: const ExpenseHomePage(),
    );
  }
}

class ExpenseItem {
  const ExpenseItem({
    this.id,
    required this.name,
    required this.price,
    required this.category,
    required this.date,
    required this.store,
  });

  final String? id;
  final String name;
  final double price;
  final String category;
  final DateTime date;
  final String store;

  Map<String, dynamic> toJson() => {
      if (id != null) 'id': id,
        'name': name,
        'price': price,
        'category': category,
        'date': date.toIso8601String(),
        'store': store,
      };

  factory ExpenseItem.fromJson(Map<String, dynamic> json) {
    return ExpenseItem(
      name: json['name'] as String,
      id: json['id'] as String?,
      price: (json['price'] as num).toDouble(),
      category: json['category'] as String,
      date: DateTime.parse(json['date'] as String),
      store: json['store'] as String? ?? 'その他',
    );
  }
}

class ReceiptLine {
  const ReceiptLine({required this.name, required this.price});

  final String name;
  final double price;
}

class ReceiptParseResult {
  const ReceiptParseResult({required this.lines, required this.rawText, this.date, this.store});

  final List<ReceiptLine> lines;
  final String rawText;
  final DateTime? date;
  final String? store;
}

class ExpenseHomePage extends StatefulWidget {
  const ExpenseHomePage({super.key});

  @override
  State<ExpenseHomePage> createState() => _ExpenseHomePageState();
}

class _ExpenseHomePageState extends State<ExpenseHomePage> {
  static const _expensesStorageKey = 'nz_expenses';
  static const _fallbackNzdToJpy = 90.0;
  static const _exchangeRateUrl = 'https://open.er-api.com/v6/latest/NZD';
  static const _stores = ['PAK\'nSAVE', 'New World', 'Woolworths', 'その他'];

  final _nameController = TextEditingController();
  final _priceController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  final List<ExpenseItem> _expenses = [];
  String _selectedCategory = '食費';
  String _selectedStore = 'その他';
  String _selectedPeriod = '今月';
  bool _isReadingReceipt = false;
  List<ReceiptLine> _receiptLines = [];
  DateTime _selectedDate = DateTime.now();
  bool _isLoadingExpenses = true;
  User? _firebaseUser;
  double _nzdToJpy = _fallbackNzdToJpy;
  bool _isLoadingRate = true;

  final _categories = const ['食費', '日用品', '外食', '交通費', '住居費', 'その他'];

  List<ExpenseItem> get _visibleExpenses => _expenses.where(_matchesPeriod).toList();

  double get _total => _visibleExpenses.fold(0.0, (total, item) => total + item.price);

  @override
  void initState() {
    super.initState();
    loadData();
    _loadExchangeRate();
  }

  Future<void> loadData() async {
    try {
      final preferences = await SharedPreferences.getInstance();
      final savedJson = preferences.getString(_expensesStorageKey);
      final localExpenses = savedJson == null
          ? (preferences.getStringList(_expensesStorageKey) ?? [])
              .asMap()
              .entries
              .map((entry) => ExpenseItem.fromJson({
                    ...(jsonDecode(entry.value) as Map<String, dynamic>),
                    'id': (jsonDecode(entry.value) as Map<String, dynamic>)['id'] ?? 'legacy-${entry.key}',
                  }))
              .toList()
          : (jsonDecode(savedJson) as List<dynamic>)
              .asMap()
              .entries
              .map((entry) => ExpenseItem.fromJson({
                    ...(entry.value as Map<String, dynamic>),
                    'id': (entry.value as Map<String, dynamic>)['id'] ?? 'legacy-${entry.key}',
                  }))
              .toList();
      if (mounted) {
        setState(() {
          _expenses
            ..clear()
            ..addAll(localExpenses);
          _isLoadingExpenses = false;
        });
      }
      await _loadFromFirestore(localExpenses);
    } catch (_) {
      if (mounted) setState(() => _isLoadingExpenses = false);
    }
  }

  CollectionReference<Map<String, dynamic>> get _expenseCollection =>
      FirebaseFirestore.instance.collection('users').doc(_firebaseUser!.uid).collection('expenses');

  Future<void> _loadFromFirestore(List<ExpenseItem> localExpenses) async {
    try {
      _firebaseUser = FirebaseAuth.instance.currentUser ?? (await FirebaseAuth.instance.signInAnonymously()).user;
      if (_firebaseUser == null) return;
      final snapshot = await _expenseCollection.get();
      if (snapshot.docs.isEmpty && localExpenses.isNotEmpty) {
        await _saveToFirestore();
      } else if (snapshot.docs.isNotEmpty && mounted) {
        final remoteExpenses = snapshot.docs.map((doc) => ExpenseItem.fromJson({'id': doc.id, ...doc.data()})).toList();
        setState(() {
          _expenses
            ..clear()
            ..addAll(remoteExpenses);
        });
        await _saveLocalData();
      }
    } catch (_) {}
  }

  Future<void> _saveLocalData() async {
    final preferences = await SharedPreferences.getInstance();
    final encodedExpenses = jsonEncode(
      _expenses.map((expense) => expense.toJson()).toList(),
    );
    await preferences.setString(
      _expensesStorageKey,
      encodedExpenses,
    );
  }

  Future<void> _saveToFirestore() async {
    if (_firebaseUser == null) return;
    final batch = FirebaseFirestore.instance.batch();
    final existing = await _expenseCollection.get();
    final currentIds = _expenses.map((expense) => expense.id).whereType<String>().toSet();
    for (final doc in existing.docs) {
      if (!currentIds.contains(doc.id)) batch.delete(doc.reference);
    }
    for (final expense in _expenses) {
      final id = expense.id ?? DateTime.now().microsecondsSinceEpoch.toString();
      batch.set(_expenseCollection.doc(id), {
        'name': expense.name,
        'price': expense.price,
        'category': expense.category,
        'date': expense.date.toIso8601String(),
        'store': expense.store,
      });
    }
    await batch.commit();
  }

  Future<void> saveData() async {
    await _saveLocalData();
    try {
      _firebaseUser ??= FirebaseAuth.instance.currentUser ?? (await FirebaseAuth.instance.signInAnonymously()).user;
      await _saveToFirestore();
    } catch (_) {}
  }

  bool _matchesPeriod(ExpenseItem item) {
    final now = DateTime.now();
    if (_selectedPeriod == '全期間') return true;
    final month = _selectedPeriod == '今月' ? now.month : now.month == 1 ? 12 : now.month - 1;
    final year = _selectedPeriod == '今月' || now.month != 1 ? now.year : now.year - 1;
    return item.date.year == year && item.date.month == month;
  }

  ExpenseItem? _cheapestForName(String name) {
    final normalizedName = name.trim().toLowerCase();
    if (normalizedName.isEmpty) return null;
    final matches = _expenses.where((item) => item.name.trim().toLowerCase() == normalizedName);
    if (matches.isEmpty) return null;
    return matches.reduce((a, b) => a.price <= b.price ? a : b);
  }

  Future<void> _pickReceipt() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      withData: true,
    );
    final bytes = result?.files.single.bytes;
    if (bytes == null) return;

    setState(() => _isReadingReceipt = true);
    try {
      final text = await recognizeReceiptText(bytes);
      if (!mounted) return;
      final parsed = _parseReceiptText(text ?? '', _selectedStore);
      if (parsed.date != null) {
        final today = DateTime.now();
        final detectedDate = parsed.date!;
        setState(() {
          _selectedDate = detectedDate.isAfter(today) ? today : detectedDate;
        });
      }
      _receiptLines = parsed.lines;
      await _showReceiptLinesDialog(parsed.rawText);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('OCRに失敗しました。手入力してください。')));
      }
    } finally {
      if (mounted) setState(() => _isReadingReceipt = false);
    }
  }

  ReceiptParseResult _parseReceiptText(String text, String store) {
    final parsedLines = <ReceiptLine>[];
    final parser = store == 'Woolworths' ? _parseWoolworthsLine : store == 'その他' ? _parseGenericLine : _parsePakOrNewWorldLine;
    for (final rawLine in text.split(RegExp(r'\r?\n'))) {
      final line = rawLine.trim().replaceAll(RegExp(r'\s+'), ' ');
      final parsedLine = parser(line);
      if (parsedLine != null) parsedLines.add(parsedLine);
    }
    final date = _parseReceiptDate(text);
    return ReceiptParseResult(lines: parsedLines, date: date, store: store, rawText: text);
  }

  ReceiptLine? _parsePakOrNewWorldLine(String line) {
    if (line.isEmpty || _isReceiptSummaryLine(line) || _isBarcodeNoise(line)) return null;
    return _parseProductPricePair(line, requireEnglishName: true);
  }

  ReceiptLine? _parseWoolworthsLine(String line) {
    if (line.isEmpty || _isReceiptSummaryLine(line) || _isBarcodeNoise(line)) return null;
    if (RegExp(r'\b(discount|saving|clubcard|special|promo|offer|rewards)\b', caseSensitive: false).hasMatch(line) || line.contains('-')) return null;
    return _parseProductPricePair(line, requireEnglishName: false);
  }

  ReceiptLine? _parseGenericLine(String line) {
    if (line.isEmpty || _isReceiptSummaryLine(line) || _isBarcodeNoise(line)) return null;
    return _parseProductPricePair(line, requireEnglishName: false);
  }

  ReceiptLine? _parseProductPricePair(String line, {required bool requireEnglishName}) {
    final match = RegExp(r'^(.+?)\s+(?:NZD\s*)?\$?\s*([0-9OoIl]{1,5}(?:[.,][0-9OoIl]{2})?)\s*$').firstMatch(line);
    if (match == null) return null;
    final name = match.group(1)!.replaceAll(RegExp(r'\s+'), ' ').trim();
    final price = _parseMoney(match.group(2)!);
    if (price == null || price <= 0 || price >= 100000 || !_looksLikeProductName(name)) return null;
    if (requireEnglishName && !RegExp(r'[A-Za-z]').hasMatch(name)) return null;
    return ReceiptLine(name: name, price: price);
  }

  bool _isBarcodeNoise(String line) => RegExp(r'^\d{8,}$').hasMatch(line.replaceAll(RegExp(r'[^0-9]'), '')) && !line.contains(RegExp(r'[A-Za-z]'));

  bool _looksLikeProductName(String name) {
    if (name.length < 2 || RegExp(r'^\d+$').hasMatch(name.replaceAll(RegExp(r'[^0-9]'), ''))) return false;
    return RegExp(r'[A-Za-z]').hasMatch(name) || RegExp(r'[ぁ-んァ-ン一-龯]').hasMatch(name);
  }

  bool _isReceiptSummaryLine(String line) {
    return RegExp(r'\b(total|subtotal|tax|gst|change|cash|visa|mastercard|eftpos|amount|合計|小計|税)\b', caseSensitive: false).hasMatch(line);
  }

  double? _parseMoney(String value) {
    final normalized = value.replaceAll(RegExp('[Oo]'), '0').replaceAll(RegExp('[Il]'), '1').replaceAll(',', '.');
    return double.tryParse(normalized);
  }

  DateTime? _parseReceiptDate(String text) {
    final numeric = RegExp(r'\b(20\d{2})[./-](\d{1,2})[./-](\d{1,2})\b').firstMatch(text);
    if (numeric != null) {
      return _validDate(int.parse(numeric.group(1)!), int.parse(numeric.group(2)!), int.parse(numeric.group(3)!));
    }
    final dayFirstLong = RegExp(r'\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b').firstMatch(text);
    if (dayFirstLong != null) {
      return _validDate(int.parse(dayFirstLong.group(3)!), int.parse(dayFirstLong.group(2)!), int.parse(dayFirstLong.group(1)!));
    }
    final dayFirst = RegExp(r'\b(\d{1,2})[./-](\d{1,2})[./-](\d{2})\b').firstMatch(text);
    if (dayFirst != null) {
      return _validDate(2000 + int.parse(dayFirst.group(3)!), int.parse(dayFirst.group(2)!), int.parse(dayFirst.group(1)!));
    }
    final written = RegExp(r'\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(20\d{2})\b', caseSensitive: false).firstMatch(text);
    if (written == null) return null;
    const months = {'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6, 'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12};
    final month = months[written.group(2)!.substring(0, 3).toLowerCase()];
    return month == null ? null : _validDate(int.parse(written.group(3)!), month, int.parse(written.group(1)!));
  }

  DateTime? _validDate(int year, int month, int day) {
    final date = DateTime(year, month, day);
    return date.year == year && date.month == month && date.day == day ? date : null;
  }

  Future<void> _showReceiptLinesDialog(String rawText) async {
    final draftLines = List<ReceiptLine>.from(_receiptLines);
    final categoryValues = List<String>.filled(draftLines.length, _selectedCategory);
    final nameControllers = draftLines.map((line) => TextEditingController(text: line.name)).toList();
    final priceControllers = draftLines.map((line) => TextEditingController(text: line.price.toStringAsFixed(2))).toList();
    final rawTextController = TextEditingController(text: rawText);
    var dialogDate = _selectedDate;
    var dialogStore = _selectedStore;
    try {
      await showDialog<void>(
        context: context,
        builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('読み取り結果を確認・修正'),
          content: SizedBox(
            width: 520,
            child: SingleChildScrollView(
              child: Column(
                children: [
                  TextField(
                    controller: rawTextController,
                    minLines: 3,
                    maxLines: 7,
                    decoration: const InputDecoration(
                      labelText: 'OCR生テキスト（参考・編集可）',
                      helperText: '読み取れなかった品目や価格はここから確認して入力できます',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.calendar_today_outlined),
                    title: const Text('購入日'),
                    subtitle: Text(_formatDate(dialogDate)),
                    onTap: () async {
                      final picked = await showDatePicker(context: context, initialDate: dialogDate, firstDate: DateTime(2020), lastDate: DateTime.now());
                      if (picked != null) setDialogState(() => dialogDate = picked);
                    },
                  ),
                  DropdownButtonFormField<String>(
                    value: dialogStore,
                    decoration: const InputDecoration(labelText: '購入店舗'),
                    items: _stores.map((store) => DropdownMenuItem(value: store, child: Text(store))).toList(),
                    onChanged: (value) => setDialogState(() => dialogStore = value!),
                  ),
                  const SizedBox(height: 12),
                  for (var index = 0; index < draftLines.length; index++)
                    Row(
                      children: [
                        Expanded(child: TextFormField(controller: nameControllers[index], decoration: const InputDecoration(labelText: '品目'))),
                        const SizedBox(width: 8),
                        SizedBox(width: 95, child: TextFormField(controller: priceControllers[index], keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: '価格'))),
                        const SizedBox(width: 8),
                        SizedBox(
                          width: 115,
                          child: DropdownButtonFormField<String>(
                            value: categoryValues[index],
                            decoration: const InputDecoration(labelText: 'カテゴリ'),
                            items: _categories.map((category) => DropdownMenuItem(value: category, child: Text(category, overflow: TextOverflow.ellipsis))).toList(),
                            onChanged: (value) => setDialogState(() => categoryValues[index] = value!),
                          ),
                        ),
                        IconButton(
                          tooltip: '明細を削除',
                          icon: const Icon(Icons.remove_circle_outline),
                          onPressed: () => setDialogState(() {
                            nameControllers[index].dispose();
                            priceControllers[index].dispose();
                            nameControllers.removeAt(index);
                            priceControllers.removeAt(index);
                            categoryValues.removeAt(index);
                            draftLines.removeAt(index);
                          }),
                        ),
                      ],
                    ),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton.icon(
                      onPressed: () => setDialogState(() {
                        draftLines.add(const ReceiptLine(name: '', price: 0));
                        categoryValues.add(_selectedCategory);
                        nameControllers.add(TextEditingController());
                        priceControllers.add(TextEditingController());
                      }),
                      icon: const Icon(Icons.add),
                      label: const Text('明細を追加'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('キャンセル')),
            FilledButton(
              onPressed: () async {
                final lines = <ReceiptLine>[];
                for (var i = 0; i < draftLines.length; i++) {
                  final price = double.tryParse(priceControllers[i].text.trim());
                  final name = nameControllers[i].text.trim();
                  if (name.isNotEmpty && price != null && price > 0) lines.add(ReceiptLine(name: name, price: price));
                }
                if (lines.isNotEmpty) {
                  _selectedDate = dialogDate;
                  _selectedStore = dialogStore;
                  await _addReceiptLines(lines, categoryValues);
                }
                if (dialogContext.mounted) Navigator.pop(dialogContext);
              },
              child: const Text('確定して登録'),
            ),
          ],
        ),
        ),
      );
    } finally {
      rawTextController.dispose();
      for (final controller in [...nameControllers, ...priceControllers]) {
        controller.dispose();
      }
    }
  }

  Future<void> _showEditDialog(int index) async {
    final expense = _expenses[index];
    final nameController = TextEditingController(text: expense.name);
    final priceController = TextEditingController(text: expense.price.toStringAsFixed(2));
    var date = expense.date;
    var category = expense.category;
    var store = expense.store;
    await showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('支出を編集'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: nameController, decoration: const InputDecoration(labelText: '品目名')),
                TextField(controller: priceController, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: '価格（NZD）')),
                DropdownButtonFormField<String>(value: category, decoration: const InputDecoration(labelText: 'カテゴリ'), items: _categories.map((value) => DropdownMenuItem(value: value, child: Text(value))).toList(), onChanged: (value) => setDialogState(() => category = value!)),
                DropdownButtonFormField<String>(value: store, decoration: const InputDecoration(labelText: '購入店舗'), items: _stores.map((value) => DropdownMenuItem(value: value, child: Text(value))).toList(), onChanged: (value) => setDialogState(() => store = value!)),
                ListTile(contentPadding: EdgeInsets.zero, title: const Text('購入日'), subtitle: Text(_formatDate(date)), onTap: () async { final picked = await showDatePicker(context: context, initialDate: date, firstDate: DateTime(2020), lastDate: DateTime.now()); if (picked != null) setDialogState(() => date = picked); }),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('キャンセル')),
            FilledButton(
              onPressed: () async {
                final price = double.tryParse(priceController.text.trim());
                if (nameController.text.trim().isEmpty || price == null || price <= 0) return;
                await updateExpense(index, ExpenseItem(id: expense.id, name: nameController.text.trim(), price: price, category: category, date: date, store: store));
                if (dialogContext.mounted) Navigator.pop(dialogContext);
              },
              child: const Text('保存'),
            ),
          ],
        ),
      ),
    );
    nameController.dispose();
    priceController.dispose();
  }

  Future<void> _addReceiptLines(List<ReceiptLine> lines, [List<String>? categories]) async {
    setState(() {
      _expenses.insertAll(0, [
        for (var index = 0; index < lines.length; index++)
          ExpenseItem(
            id: DateTime.now().microsecondsSinceEpoch.toString() + index.toString(),
            name: lines[index].name,
            price: lines[index].price,
            category: categories != null && index < categories.length ? categories[index] : _selectedCategory,
            date: _selectedDate,
            store: _selectedStore,
          ),
      ]);
      _receiptLines = [];
    });
    await saveData();
  }

  Future<void> _selectDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      helpText: '購入日を選択',
      cancelText: 'キャンセル',
      confirmText: '決定',
    );
    if (date != null) setState(() => _selectedDate = date);
  }

  Future<void> _loadExchangeRate() async {
    try {
      final response = await http.get(Uri.parse(_exchangeRateUrl)).timeout(const Duration(seconds: 8));
      if (response.statusCode != 200) throw Exception('Exchange rate request failed');

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final rates = data['rates'] as Map<String, dynamic>?;
      final rate = (rates?['JPY'] as num?)?.toDouble();
      if (rate == null || rate <= 0) throw Exception('JPY rate is unavailable');

      if (mounted) {
        setState(() {
          _nzdToJpy = rate;
          _isLoadingRate = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoadingRate = false);
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  Future<void> _addExpense() async {
    if (_isLoadingExpenses) return;
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _expenses.insert(
        0,
        ExpenseItem(
          id: DateTime.now().microsecondsSinceEpoch.toString(),
          name: _nameController.text.trim(),
          price: double.parse(_priceController.text.trim()),
          category: _selectedCategory,
          date: _selectedDate,
          store: _selectedStore,
        ),
      );
      _nameController.clear();
      _priceController.clear();
      _selectedDate = DateTime.now();
    });
    await saveData();
  }

  Future<void> updateExpense(int index, ExpenseItem updatedExpense) async {
    setState(() => _expenses[index] = updatedExpense);
    await saveData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.public, size: 25),
            SizedBox(width: 10),
            Text('NZ Expense Hub'),
          ],
        ),
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final contentWidth = constraints.maxWidth > 900 ? 880.0 : double.infinity;
          return Center(
            child: SizedBox(
              width: contentWidth,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _buildPeriodFilter(),
                    const SizedBox(height: 16),
                    _buildTotalCard(),
                    const SizedBox(height: 16),
                    _buildCategorySummary(),
                    const SizedBox(height: 24),
                    _buildAddForm(),
                    const SizedBox(height: 28),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('最近の記録', style: Theme.of(context).textTheme.titleLarge),
                        Text(
                          '${_visibleExpenses.length}件',
                          style: const TextStyle(color: Color(0xff52706a)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildExpenseList(),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTotalCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xff087f5b),
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x22063b2f),
            blurRadius: 16,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          const CircleAvatar(
            radius: 26,
            backgroundColor: Color(0x33ffffff),
            child: Icon(Icons.account_balance_wallet_outlined, color: Colors.white),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('今月の合計', style: TextStyle(color: Color(0xffd5f5e8))),
              const SizedBox(height: 4),
              Text(
                '\$${_total.toStringAsFixed(2)} NZD',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 30,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '約 ${_formatYen(_total * _nzdToJpy)} 円（1 NZD = ${_nzdToJpy.toStringAsFixed(1)} 円）',
                style: const TextStyle(color: Color(0xffd5f5e8)),
              ),
              if (_isLoadingRate)
                const Padding(
                  padding: EdgeInsets.only(top: 6),
                  child: Text('為替レートを取得中...', style: TextStyle(color: Color(0xffd5f5e8), fontSize: 12)),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCategorySummary() {
    final monthlyExpenses = _visibleExpenses;
    final categoryTotals = <String, double>{};
    for (final category in _categories) {
      categoryTotals[category] = monthlyExpenses
          .where((item) => item.category == category)
          .fold(0.0, (total, item) => total + item.price);
    }

    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('カテゴリ別の割合', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 14),
            if (_total == 0)
              const Text('今月の支出を追加すると、割合が表示されます', style: TextStyle(color: Color(0xff52706a)))
            else
              ...categoryTotals.entries.where((entry) => entry.value > 0).map((entry) {
                final ratio = entry.value / _total;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(entry.key),
                          Text('${(ratio * 100).toStringAsFixed(0)}%  ¥${_formatYen(entry.value * _nzdToJpy)}'),
                        ],
                      ),
                      const SizedBox(height: 5),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: ratio,
                          minHeight: 9,
                          backgroundColor: const Color(0xffe1f2ec),
                          color: const Color(0xff087f5b),
                        ),
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  Widget _buildPeriodFilter() {
    return SegmentedButton<String>(
      segments: const [
        ButtonSegment(value: '今月', label: Text('今月'), icon: Icon(Icons.today_outlined)),
        ButtonSegment(value: '先月', label: Text('先月'), icon: Icon(Icons.history)),
        ButtonSegment(value: '全期間', label: Text('全期間'), icon: Icon(Icons.all_inclusive)),
      ],
      selected: {_selectedPeriod},
      onSelectionChanged: (selection) => setState(() => _selectedPeriod = selection.first),
    );
  }

  Widget _buildAddForm() {
    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('支出を追加', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _isReadingReceipt ? null : _pickReceipt,
                icon: _isReadingReceipt
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.document_scanner_outlined),
                label: Text(_isReadingReceipt ? 'レシートを解析中...' : 'レシート画像をアップロード'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _nameController,
                onChanged: (_) => setState(() {}),
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(labelText: '品目名', hintText: '例: 牛乳、バス代'),
                validator: (value) => value == null || value.trim().isEmpty
                    ? '品目名を入力してください'
                    : null,
              ),
              const SizedBox(height: 14),
              DropdownButtonFormField<String>(
                value: _selectedStore,
                decoration: const InputDecoration(labelText: '購入店舗'),
                items: _stores.map((store) => DropdownMenuItem(value: store, child: Text(store))).toList(),
                onChanged: (value) => setState(() => _selectedStore = value!),
              ),
              Builder(
                builder: (context) {
                  final cheapest = _cheapestForName(_nameController.text);
                  if (cheapest == null) return const SizedBox.shrink();
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      '${cheapest.store}で最安値 \u0024${cheapest.price.toStringAsFixed(2)}',
                      style: const TextStyle(color: Color(0xff087f5b), fontWeight: FontWeight.w600),
                    ),
                  );
                },
              ),
              const SizedBox(height: 14),
              InkWell(
                onTap: _selectDate,
                borderRadius: BorderRadius.circular(12),
                child: InputDecorator(
                  decoration: const InputDecoration(labelText: '購入日', suffixIcon: Icon(Icons.calendar_today_outlined)),
                  child: Text(_formatDate(_selectedDate)),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _priceController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: '価格（NZD）', prefixText: '\$ '),
                      validator: (value) {
                        final price = double.tryParse(value?.trim() ?? '');
                        return price == null || price <= 0 ? '正しい金額を入力してください' : null;
                      },
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _selectedCategory,
                      decoration: const InputDecoration(labelText: 'カテゴリ'),
                      items: _categories.map((category) {
                        return DropdownMenuItem(value: category, child: Text(category));
                      }).toList(),
                      onChanged: (value) => setState(() => _selectedCategory = value!),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: _isLoadingExpenses ? null : _addExpense,
                  icon: const Icon(Icons.add),
                  label: const Text('記録を追加'),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 15),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildExpenseList() {
    if (_isLoadingExpenses) {
      return const Padding(
        padding: EdgeInsets.all(32),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (_visibleExpenses.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 32),
        child: Column(
          children: [
            Icon(Icons.receipt_long_outlined, size: 48, color: Color(0xff9ab3ad)),
            SizedBox(height: 12),
            Text('まだ記録がありません', style: TextStyle(color: Color(0xff52706a))),
          ],
        ),
      );
    }

    return Column(
      children: _visibleExpenses.map((item) {
        final index = _expenses.indexOf(item);
        final cheapest = _cheapestForName(item.name);
        return Card(
          elevation: 0,
          margin: const EdgeInsets.only(bottom: 10),
          color: Colors.white,
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: const Color(0xffe1f2ec),
              child: Icon(_iconForCategory(item.category), color: const Color(0xff087f5b)),
            ),
            title: Text(item.name, style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text(
              '${item.category} ・ ${_formatDate(item.date)} ・ ${item.store}'
              '${cheapest != null && cheapest != item ? ' ・ ${cheapest.store}で最安値 \u0024${cheapest.price.toStringAsFixed(2)}' : ''}',
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '\$${item.price.toStringAsFixed(2)} NZD',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    Text(
                      '(約${_formatYen(item.price * _nzdToJpy)}円)',
                      style: const TextStyle(color: Color(0xff52706a), fontSize: 12),
                    ),
                  ],
                ),
                IconButton(
                  tooltip: '編集',
                  icon: const Icon(Icons.edit_outlined),
                  onPressed: () => _showEditDialog(index),
                ),
                IconButton(
                  tooltip: '削除',
                  icon: const Icon(Icons.delete_outline),
                  onPressed: () async {
                    setState(() => _expenses.removeAt(index));
                    await saveData();
                  },
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  IconData _iconForCategory(String category) {
    switch (category) {
      case '食費':
        return Icons.shopping_basket_outlined;
      case '日用品':
        return Icons.home_outlined;
      case '外食':
        return Icons.restaurant_outlined;
      case '交通費':
        return Icons.directions_bus_outlined;
      case '住居費':
        return Icons.apartment_outlined;
      default:
        return Icons.more_horiz;
    }
  }
}

String _formatDate(DateTime date) {
  return '${date.year}/${date.month.toString().padLeft(2, '0')}/${date.day.toString().padLeft(2, '0')}';
}

String _formatYen(double amount) {
  final digits = amount.round().toString();
  return digits.replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (match) => ',');
}
