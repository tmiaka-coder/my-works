// ignore_for_file: avoid_web_libraries_in_flutter

import 'dart:convert';
import 'dart:js_util' as js_util;

Future<String?> recognizeReceiptText(List<int> bytes) async {
  final tesseract = js_util.getProperty(js_util.globalThis, 'Tesseract');
  if (tesseract == null) return null;

  final recognize = js_util.getProperty(tesseract, 'recognize');
  final dataUrl = 'data:image/jpeg;base64,${base64Encode(bytes)}';
  final result = await js_util.promiseToFuture<dynamic>(
    js_util.callMethod<dynamic>(recognize, 'call', [tesseract, dataUrl, 'eng']),
  );
  final data = js_util.getProperty(result, 'data');
  return js_util.getProperty<String>(data, 'text');
}
