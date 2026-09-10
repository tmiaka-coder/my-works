// ignore_for_file: avoid_web_libraries_in_flutter

import 'dart:convert';
import 'dart:js_util' as js_util;

Future<String?> recognizeReceiptText(List<int> bytes) async {
  final tesseract = js_util.getProperty(js_util.globalThis, 'Tesseract');
  if (tesseract == null) return null;

  final imageBytes = await _convertHeicIfNeeded(bytes);
  final recognize = js_util.getProperty(tesseract, 'recognize');
  final dataUrl = 'data:image/jpeg;base64,${base64Encode(imageBytes)}';
  final result = await js_util.promiseToFuture<dynamic>(
    js_util.callMethod<dynamic>(recognize, 'call', [tesseract, dataUrl, 'eng']),
  );
  final data = js_util.getProperty(result, 'data');
  return js_util.getProperty<String>(data, 'text');
}

Future<List<int>> _convertHeicIfNeeded(List<int> bytes) async {
  if (!_isHeic(bytes)) return bytes;

  final converter = js_util.getProperty(js_util.globalThis, 'heic2any');
  if (converter == null) {
    throw StateError('HEIC画像変換ライブラリを読み込めませんでした');
  }

  final uint8ArrayConstructor = js_util.getProperty(js_util.globalThis, 'Uint8Array');
  final blobConstructor = js_util.getProperty(js_util.globalThis, 'Blob');
  final typedBytes = js_util.callConstructor<dynamic>(uint8ArrayConstructor, [bytes]);
  final blob = js_util.callConstructor<dynamic>(blobConstructor, [
    [typedBytes],
    {'type': 'image/heic'},
  ]);
  final converted = await js_util.promiseToFuture<dynamic>(
    js_util.callMethod<dynamic>(converter, 'call', [
      js_util.globalThis,
      {'blob': blob, 'toType': 'image/jpeg', 'quality': 0.9},
    ]),
  );
  final jpegBlob = converted is List ? converted.first : converted;
  final arrayBuffer = await js_util.promiseToFuture<dynamic>(
    js_util.callMethod<dynamic>(jpegBlob, 'arrayBuffer', []),
  );
  final uint8Array = js_util.callConstructor<dynamic>(uint8ArrayConstructor, [arrayBuffer]);
  final length = js_util.getProperty<int>(uint8Array, 'length');
  return [for (var index = 0; index < length; index++) js_util.getProperty<int>(uint8Array, index.toString())];
}

bool _isHeic(List<int> bytes) {
  if (bytes.length < 12) return false;
  final brand = String.fromCharCodes(bytes.sublist(8, 12)).toLowerCase();
  return brand == 'heic' || brand == 'heix' || brand == 'hevc' || brand == 'hevx' || brand == 'mif1';
}
