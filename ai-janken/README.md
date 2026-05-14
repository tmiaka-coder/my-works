# AIじゃんけん 🤚✌️✊

カメラに手をかざしてCPUとじゃんけんで対戦するWebアプリです。  
AI（MediaPipe Hands）がブラウザ内でリアルタイムに手の形を認識します。

## デモ

GitHub Pages でホストされている場合:  
`https://<your-username>.github.io/<your-repo-name>/`

---

## 🔒 セキュリティについて

| 項目 | 内容 |
|------|------|
| **APIキー** | 使用なし。外部サービスへの認証情報は一切不要 |
| **カメラ映像** | ブラウザ内で完結。外部サーバーへ送信しない |
| **AI処理** | MediaPipe によるオンデバイス処理 |
| **XSS対策** | DOM更新はすべて `textContent` を使用（`innerHTML` 不使用） |
| **入力検証** | 認識ジェスチャーはホワイトリストで検証 |

---

## 🚀 GitHub Pages への公開手順

### 1. リポジトリを作成

```bash
git init
git add .
git commit -m "initial commit"
```

GitHub でリポジトリを作成し、リモートを追加:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

### 2. GitHub Pages を有効化

1. リポジトリの **Settings** → **Pages** を開く
2. **Source**: `Deploy from a branch`
3. **Branch**: `main` / `/ (root)`
4. **Save** をクリック

数分後に `https://<your-username>.github.io/<your-repo>/` で公開されます。

> **⚠️ 重要**: カメラAPIは **HTTPS** でのみ動作します。  
> GitHub Pages は自動的に HTTPS を提供するので問題ありません。

---

## 🛠️ ローカル開発

HTTPSが必要なため、シンプルなローカルサーバーでは動作しません。  
以下のいずれかを使用してください:

```bash
# Node.js がある場合
npx serve .

# Python がある場合
python3 -m http.server 8080
```

> ローカルの `http://localhost` は例外的にカメラAPIが使えます。

---

## 📂 ファイル構成

```
.
├── index.html        # アプリ本体
├── script.js         # AI認識・ゲームロジック
├── style.css         # スタイル
├── manifest.json     # PWA設定
├── sw.js             # Service Worker（オフライン対応）
├── icon-192x192.png  # PWAアイコン
└── icon-512x512.png  # PWAアイコン
```

---

## 🎮 遊び方

1. ページを開きカメラの使用を許可する
2. カメラに手を映す（グー・チョキ・パー）
3. 「じゃんけん、ぽん！」ボタンを押す
4. CPUとの勝負結果を確認！

---

## 🧰 使用技術

- [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands) — 手のランドマーク検出
- [Tailwind CSS](https://tailwindcss.com/) — スタイリング
- Web APIのみ（フレームワーク不要）
