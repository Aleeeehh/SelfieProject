rm -r server/build
cd client
npm install
npm run build
mv build ../server/build
cd ..
echo "Press Enter to exit"
read