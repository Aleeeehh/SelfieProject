rm -r server/build
cd client
npm install
npm run build
mv build ../server/build
cd ../server
npm install
npm run dev
cd ..