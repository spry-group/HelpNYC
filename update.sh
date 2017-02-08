#!/bin/bash

STAMP=`date +%Y%m%d.%H%M%S`
git reset --hard
git pull

python <<EOPY
execfile("server/importOpportunities.py")
importOpportunities(username='nycmap', secret='72aeb4669919054fb0c9bb0643a879f0', ongoing=False)
importOpportunities(username='nycmap', secret='72aeb4669919054fb0c9bb0643a879f0', ongoing=True)
EOPY

git commit -a -m "Data Update $STAMP"
git push


