import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'ocr_service.dart';

void main() {
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
    required this.name,
    required this.price,
    required this.category,
    required this.date,
    required this.store,
  });

  final String name;
  final double price;
  final String category;
  final DateTime date;
  final String store;

  Map<String, dynamic> toJson() => {
        'name': name,
        'price': price,
        'category': category,
        'date': date.toIso8601String(),
        'store': store,
      };

  factory ExpenseItem.fromJson(Map<String, dynamic> json) {
    return ExpenseItem(
      name: json['name'] as String,
      price: (json['price'] as num).toDouble(),
      category: json['category'] as String,
      date: DateTime.parse(json['date'] as String),
      store: json['store'] as String? ?? 'その他',
    );
  }
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
  DateTime _selectedDate = DateTime.now();
  bool _isLoadingExpenses = true;
  double _nzdToJpy = _fallbackNzdToJpy;
  bool _isLoadingRate = true;

  final _categories = const ['食費', '日用品', '外食', '交通費', '住居費', 'その他'];

  List<ExpenseItem> get _visibleExpenses => _expenses.where(_matchesPeriod).toList();

  double get _total => _visibleExpenses.fold(0.0, (sum, item) => sum + item.price);

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
      final restoredExpenses = savedJson == null
          ? (preferences.getStringList(_expensesStorageKey) ?? [])
              .map((value) => ExpenseItem.fromJson(jsonDecode(value) as Map<String, dynamic>))
              .toList()
          : (jsonDecode(savedJson) as List<dynamic>)
              .map((value) => ExpenseItem.fromJson(value as Map<String, dynamic>))
              .toList();
      if (mounted) {
        setState(() {
          _expenses
            ..clear()
            ..addAll(restoredExpenses);
          _isLoadingExpenses = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingExpenses = false);
    }
  }

  Future<void> saveData() async {
    final preferences = await SharedPreferences.getInstance();
    final encodedExpenses = jsonEncode(
      _expenses.map((expense) => expense.toJson()).toList(),
    );
    await preferences.setString(
      _expensesStorageKey,
      encodedExpenses,
    );
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
      final parsed = _parseReceiptText(text ?? '');
      if (parsed.price != null) _priceController.text = parsed.price!.toStringAsFixed(2);
      if (parsed.name != null) _nameController.text = parsed.name!;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(parsed.hasValue ? 'レシートを解析しました。内容を確認してください。' : '文字を読み取れませんでした。手入力してください。')),
      );
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('OCRに失敗しました。手入力してください。')));
      }
    } finally {
      if (mounted) setState(() => _isReadingReceipt = false);
    }
  }

  ({String? name, double? price, bool hasValue}) _parseReceiptText(String text) {
    final lines = text.split(RegExp(r'\r?\n')).map((line) => line.trim()).where((line) => line.isNotEmpty).toList();
    final priceMatches = RegExp(r'(?:\$|NZD)?\s*(\d{1,4}(?:[,.]\d{2}))\b').allMatches(text);
    final prices = priceMatches.map((match) => double.tryParse(match.group(1)!.replaceAll(',', ''))).whereType<double>().toList();
    final price = prices.isEmpty ? null : prices.reduce((a, b) => a > b ? a : b);
    final name = lines.firstWhere((line) => !line.toUpperCase().contains('TOTAL') && !RegExp(r'^\$?\s*\d').hasMatch(line), orElse: () => '');
    return (name: name.isEmpty ? null : name, price: price, hasValue: name.isNotEmpty || price != null);
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
          .fold(0.0, (sum, item) => sum + item.price);
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
