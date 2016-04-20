babel node_modules/ntpsync-client/sources-es6/ --presets babel-preset-es2015 --out-dir babelOutput
mkdir -p client/ntpsync-client
browserify babelOutput/* -o client/ntpsync-client/ntpsync-client.js
rm -rf babelOutput/
