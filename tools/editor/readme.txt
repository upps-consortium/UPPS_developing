UPPSプロファイルを編集するためのエディター

## 使い方

1. ローカルサーバーを起動します。
   ```bash
   cd tools/editor/upps_editor
   python3 -m http.server
   ```
2. ブラウザで `http://localhost:8000` を開きます。
3. `index.html` からUPPS Persona Editorを利用できます。

ESモジュールを使用しているため、ファイルを直接開くとスクリプトが読み込めません。必ずローカルサーバー経由でアクセスしてください。
