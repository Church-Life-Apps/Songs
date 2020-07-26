import os
import json

sourcepath = r'C:\Users\Eric\Documents\Documents\Code\Songs\resources\Songs_&_Hymns_Of_Life\metadata'
targetpath = r'C:\Users\Eric\Documents\Documents\Code\Songs\resources\Songs_&_Hymns_Of_Life\metadata-json'

for file in os.listdir(sourcepath):
    print(file)
    with open(os.path.join(sourcepath, file), encoding="utf-8", mode='r') as f:
        json_data = {}
        lyrics = {}
        current_lyric_section = ""
        for line in f.readlines():
            line = line.strip().replace(u"\u2018", "'").replace(u"\u2019", "'").replace(u"\u201c", '"').replace(u"\u201d", '"')

            if '< KeepItInTune >' in line or len(line) == 0:
                continue
            elif line[0] == '.' and ':' in line:
                idvalue = line.split(':')
                id = idvalue[0][1:].strip().title().replace(' ', '')
                id = id[0].lower() + id[1:]
                value = ""

                if len(idvalue) == 2:
                    value = idvalue[1].strip()
                elif len(idvalue) > 2:
                    print("ERROR: Attribute line in unexpected format.")

                if id == "page":
                    id = "pages"

                if id == "title":
                    song_number, title = value.strip().split(' - ')
                    song_number = int(song_number)
                    json_data["title"] = title
                    json_data["songNumber"] = song_number
                else:
                    json_data[id] = value

                    
            elif '[' in line and ']' in line:
                current_lyric_section = line[1:-1]
                lyrics[current_lyric_section] = []
            else:
                lyrics[current_lyric_section].append(line)
        
        json_data["lyrics"] = lyrics

    print(json.dumps(json_data, indent=2))
    with open(os.path.join(targetpath, os.path.splitext(file)[0] + ".json"), encoding="utf-8", mode='w') as f:
        f.write(json.dumps(json_data, indent=2))

    # break

    