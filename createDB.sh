###
# use this script to install on macos Mongodb and use it for server testing
###

brew update 

# remove arch -arm64 if you have MacOS with Intel processor
arch -arm64 brew install mongodb-community@7.0

brew services start mongodb-community@7.0
