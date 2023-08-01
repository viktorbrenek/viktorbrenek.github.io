---
title: Gamedev log 7# - Summer Heat
description: "Documentary of my game development."
ogImage: gamedev
lang: en
tags:
  - 🖥️ Gamedev
---
## Holiday Season
Summer... The season of extreme temperatures that are more exhausting than pleasant. Sometimes the borders between the realities have been blurred, and I found myself in those very desert places that I have been painfully creating inside of Unity. The work was slow and ineffective because I felt like a Camel Spider desperately chasing a shadow... What a drama queen... right? I mean... surely the fires in Italy, USA, and Australia have nothing to do with the Fallout wasteland appearing in my backyard. Well, at least I don't have to go far for inspiration. And I have to say that in these 2 weeks, I had plenty of ideas.
<br></br>
## Questing and Dialog overhaul
One of the major changes is the implementation of new Quest and Dialog systems. Those systems are both paid assets from the Unity store from Pixel Crushers and both have absolute top ratings and are used in various popular games like Disco Elysium. Thanks to a summer sale on the Assets Store, I've been able to purchase them. One of the reasons was also the full support for RPG Builder from Blink Studios, which I am also using. Even though I was really afraid of the implementation because those assets are script-heavy and even involve changing stuff with the database, the implementation was smooth and without any problems. At least the initial setup. I have been able to test out some quests and dialogues, but that's pretty much it, because I didn't want to rush it and make a mess in the database. Also, there are a lot of tutorial videos and paper manuals to read through, so I am able to fully embrace the power of these tools.
<br></br>
[Quest Machine](https://assetstore.unity.com/packages/tools/game-toolkits/quest-machine-39834),
[Dialogue Systems for Unity](https://assetstore.unity.com/packages/tools/behavior-ai/dialogue-system-for-unity-11672)
<br></br>
You might be asking why we needed this. The old RPG Builder system is just too simplified. Before the update, we could only have two types of quests: a "kill" type and a "bring thing" type. Now we are nearly limitless. We can do dialogue quests, follow NPC, find NPC, harvest quests, and much more. Before the update, we would also need to script every single quest by hand. Now we can generate quests from the set of properties, and we can even do that in run-time. So I can create a hunter NPC, for example, and he can generate bounties for you endlessly.

The Dialogue system is also powerful, and it's fully connected to Quest Machine. Thanks to this, we can do dialogues much more complex, even with conditions like time, faction, and more. The UI needs a full rework. So just ignore that for now.

![image](https://cdn.discordapp.com/attachments/980416693094453268/1133882871908671549/image.png)
![image](https://cdn.discordapp.com/attachments/980416693094453268/1133882778962895048/image.png)

## Furniture
I have also added some furniture for my houses. I modeled some of it in Blender, and the rest comes from 3D model packs from Synty Studios, which I bought a few months ago. I figured that it's pointless to model everything from scratch since the Synty style kind of matches my style.

Most of them needed to be adjusted in Blender anyway so that they match the graphical style of my RGB masking. Afterward, I even added some VFX effects in Unity from the Polygon Stylized SFX pack, which go very nicely with the style of the game.

I will need many more models in the future, but for now, I have focused mostly on the crafting stations and stuff related to some interactivity. I also plan to model a full farming set, including pots, fields, pumps, and other stuff.
<br></br>
[Synty Studios](https://syntystore.com),
[Polygon Particle FX](https://assetstore.unity.com/packages/vfx/particles/polygon-particle-fx-low-poly-3d-art-by-synty-168372)
<br></br>
There are some crafting stations:

![image](https://cdn.discordapp.com/attachments/980416693094453268/1133882660297658541/image.png)
![image](https://cdn.discordapp.com/attachments/980416693094453268/1135690219522371685/image.png)
![image](https://cdn.discordapp.com/attachments/980416693094453268/1135690269459742810/image.png)
![image](https://cdn.discordapp.com/attachments/980416693094453268/1135690355061293156/image.png)

And few other models: 
![image](https://cdn.discordapp.com/attachments/980416693094453268/1135689537503363173/image.png)
![image](https://cdn.discordapp.com/attachments/980416693094453268/1135689401154945055/image.png)
![image](https://cdn.discordapp.com/attachments/980416693094453268/1133883074216726579/image.png)
![image](https://cdn.discordapp.com/attachments/980416693094453268/1133883032911220838/image.png)

## That's it. Thank you for reading :)

[Youtube](https://www.youtube.com/c/ViktorBřenekYT)
[Discord](https://discord.com/invite/2Uj6N5N)



[[toc]]