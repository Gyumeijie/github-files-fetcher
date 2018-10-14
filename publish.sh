#! /bin/bash 


# Step1: add !/usr/bin/env node to index.js
pushd dist 1>/dev/null

sed  -i '/#! *\/usr\/bin\/env *node/d' index.js 

touch tempfile.$$
echo '#!/usr/bin/env node' >> tempfile.$$
cat index.js >> tempfile.$$
mv tempfile.$$ index.js

# Step2: run npm publish
npm publish

pushd 1>/dev/null