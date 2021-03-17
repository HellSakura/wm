#!/bin/sh

rm -rf dist
mkdir dist

# 客户端编译
cd client
go build .
cd ..
mv client/wm* dist/

# 脚本编译
yarn install
yarn build