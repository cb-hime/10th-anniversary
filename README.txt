BIRTHDAY AR - 9/25 本番仕様

変更内容
- 認識画像は1枚のまま
- 何度認識しても同じ movie.mp4 を再生
- 3→2→1 のカウントダウン中に画像から外れたら即中止し、スキャンへ戻る
- 動画終了後、下記メッセージを1行ずつ表示
  THANK YOU
  10周年おめでとうございます！
  10年間、私たちを導いてくださり
  ありがとうございます。
  これまでの10年に感謝を。
  そして、これからの10年も一緒に。
  社員一同より
- 最後に「カメラを起動」ボタンを表示
- ボタンを押すとスキャン画面へ戻る
- SECRET MESSAGE / START は現状維持
- 初回起動時の半分白い画面対策を統合
- MindAR標準のスキャンUIは非表示

GitHub更新方法
1. ZIPを解凍
2. birthday-ar リポジトリで Add file → Upload files
3. index.html / style.css / script.js / targets.mind をアップロード
4. 既存の movie.mp4 はそのまま残す
5. Commit changes
6. Actions の Pages が緑になったら確認

確認URL
https://cb-hime.github.io/birthday-ar/?v=925final

注意
このZIPには movie.mp4 を入れていません。
今GitHubにある動画をそのまま使います。
