#!/usr/bin/bash

tag_name=$1
tag_parts=(${tag_name//@/ })
plugin_name_parts=(${tag_parts[0]//-/ })
plugin_name=${plugin_name_parts[1]}
version=${tag_parts[1]}

find -not -iwholename '*.git*' -iname *${plugin_name}* -type f | zip ${plugin_name}-${version}.zip -@
