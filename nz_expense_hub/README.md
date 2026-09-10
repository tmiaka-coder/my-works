# NZ Expense Hub

ニュージーランドの生活費を記録する Flutter Web アプリです。

## Firebase API キー

Firebase Web の API キーはソースコードに固定せず、ビルド時に渡します。

```bash
flutter run -d chrome --dart-define=FIREBASE_API_KEY="$FIREBASE_API_KEY"
flutter build web --release --dart-define=FIREBASE_API_KEY="$FIREBASE_API_KEY"
```

Web API キーは完全な秘密ではありませんが、Google Cloud Console で HTTP リファラーを公開ドメインに制限し、不要な API を無効化してください。Firestore のデータ保護は API キーではなく、認証と `firestore.rules` で行います。

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.
