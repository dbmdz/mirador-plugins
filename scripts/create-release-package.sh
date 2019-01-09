#!/usr/bin/env bash

# check if tag name was passed as argument
if [[ $# -eq 0 ]]
then
  echo 'You have to pass a tag name as first argument!'
  exit 1
fi

# extract the plugin name and the version from the given tag name
tag_name=$1
tag_parts=(${tag_name//@/ })
plugin_name_parts=(${tag_parts[0]//-/ })
plugin_name=${plugin_name_parts[1]}
version=${tag_parts[1]}

# install dependencies
npm install
# create minified files
npm run minify
# pack all the corresponding files to a zip archive
find -not -iwholename '*.git*' -iname *${plugin_name}* -type f | zip ${plugin_name}-${version}.zip -@
# clean all modules again
npm run clean
