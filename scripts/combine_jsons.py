import os, json, re

metadataPath = "metadata/"
songlistjson = "BlackBookSongList.json"
bookName = "Songs and Hymns of Life"

data = {}
data[bookName] = []

songlistdata = json.loads(open(songlistjson).read())

for i in range(1, 533 + 1):
  with open(metadataPath + str(i) + ".json") as f:
    songData = json.loads(f.read())
    songData["author"] = songlistdata['songs'][i-1]["author"]
    songData["title"] = songlistdata['songs'][i-1]["title"]
    del songData["theme2"]
    del songData["urlLink"]
    del songData["scripture"]
    del songData["dateComposed"]
    del songData["misc"]
    del songData["notes"]
    del songData["guitar"]
    del songData["key"]
    del songData["ccli"]
    data[bookName].append(songData)



with open("songs.json", "w+") as f:
  songsdata = json.dumps(data)
  songsdata.replace("anonymous", "Anonymous")
  songsdata = re.sub(r'\"V(\d)\"', '\"v\g<1>\"', songsdata)
  songsdata = re.sub(r'\"C(\d)\"', '\"c\g<1>\"', songsdata)
  songsdata = re.sub(r'\"P(\d)\"', '\"p\g<1>\"', songsdata)
  songsdata = re.sub(r'\"B(\d)\"', '\"b\g<1>\"', songsdata)
  f.write(songsdata)