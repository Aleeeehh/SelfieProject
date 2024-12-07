rm -r server/webapp/build
cd client
npm install
npm run build
mkdir -p ../server/webapp
mv build ../server/webapp/build
cd ..
echo "Press Enter to exit"
read