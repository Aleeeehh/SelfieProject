rm -r server/build
cd client
npm install
npm run build
mkdir -p ../server/webapp
mv build ../server/webapp/build
cd ../server
npm install
npm run dev
cd ..