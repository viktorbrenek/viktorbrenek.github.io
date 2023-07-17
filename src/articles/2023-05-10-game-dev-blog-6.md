---
title: Gamedev log 6# - Grindset
description: "Documentary of my game development."
ogImage: gamedev
lang: en
tags:
  - 🖥️ Gamedev
---
## I dont even bother to apologize again
Hi.
Oops, I did it again. I wasn't posting much, I know. If you are a regular follower of my website, 
you must feel disappointed. However, I was posting on my Discord at least. I also made some progress 
on the game. So, in today's blog post, I will summarize the last two months, which have been really 
chaotic. I was highly focused on growing the community on my YouTube channel around gaming content, 
which I hope will pay off in the future when I finally release this mutant child of mine.
#
## Mechanics
Nope, nothing new here, sadly. However, I do have a few ideas for the future. For example, I've been thinking about implementing death penalties and regeneration penalties. Currently, if you die in the game, nothing happens. You simply respawn at the "graveyard" point (which is a location set up manually). In the future, I have been considering reducing the maximum health value temporarily. Perhaps even affecting things like energy or your posture value, which could lead to more dangerous situations in the world.
There are still some plans for critical injuries, such as limb amputations, but I am not sure how to implement that right now. Maybe a small percentage chance to get critically damaged, which would force you into a replacement with some movement speed penalty (when a leg is damaged) or an attack speed penalty (when an arm is damaged). 
#
Also, I have started watching a YouTube channel of Timothy Cain, who led Troika Game Studio back in 2000 and was behind projects like Arcanum (my favorite game) and Temple of Elemental Evil. This guy is highly describable by two words: 'knowledge' and 'experience'... He is truly an inspiration for me in terms of game development. So, I might refine the game with some ideas that he inspired me with.
#
For example, I am really thinking about dividing the game into 4 biomes. A desert inspired by Tula Desert from Arcanum and also from Kenshi. A swamp that just seems cool to me, and I might include some meadows in it because I like the appearance of Outward's meadow areas. A bunker biome which would lead you to the underground system of tunnels and caves where a great and ancient culture used to reside before mysterious events wiped them all out, which is also kind of inspired by Arcanum, but also by an Apple TV Series called "Silo". Lastly, an ocean biome, which would be a vast and cool place to explore on a ship (not sure if I will be able to do something like that). This last biome would definitely mean that I would have to remake the whole character controller or use some other asset from the Unity Store. Let me be clear... this is not an easy task. So, I am kinda scared to do that right now in the middle of development. If this idea proves to be too much work, I might turn the "meadows" sub-idea into a separate biome. 
#
There is also some news regarding the building system WIP. The modular way is definitely something that I would like to implement in some way. However, I am also thinking about a more "city builder" style, where a player could build the whole building without needing to place down each separate wall. It's cool, don't get me wrong, but it's definitely not for everybody who just wants to play an RPG and maybe have something extra like a colony that is automated and serves as both a home and perhaps even a material production center, or something like that. These buildings could also be upgraded to produce more materials or produce them quicker. So, it would be kind of similar to the old school browser games where you could do something like that. But also, I would still like to have options like building containers for your loot or wardrobes for your clothes, etc. So, this element would persist. 
#
I have millions of ideas and things that I would like to add or improve. The problem is time and the fact that I might not be able to include them all. So, I will try to focus and make a to-do list, which may help me stay on track and be less distracted by the world full of possibilities. 
#
## I have been modeling! 
#
Even though it might seem that I spent more time thinking than working, I actually added a lot of new things. Specifically, a new animal, a new monster, and a new enemy race, which also has 2 sub-variants. Other than that, I have also remodeled all the weapons, buildings, and a few other things.
#
Firstly, let's talk about the new wildlife. This is a bird; I don't have a name for it yet. It remains neutral if you don't attack it. Similar to the goatzellas, these birds are just simple animals that will serve as a material source and also provide a small amount of XP. Maybe they can even be tamed or ridden in the future. The animations are terrible, but nothing that cannot be upgraded in the future.
#
![image](https://cdn.discordapp.com/attachments/980416693094453268/1130245019840823336/image.png)
#
There is also a new monster: the spider! Yeah... how original. The reason why I used them is simple. They are a typical monster in all the RPGs I have ever played. But I also wanted to reintroduce the old-school mythical race of Arachnes, which has been present in a few RPGs based on DnD. They are usually mutated humanoids with the upper body of a human female where the head of the spider would be. So, logically, I wanted to model a spider, which proved to be easy, but animating it was impossible for my level of knowledge. So, I just bought it. Yes, the model of the spider is an asset, which I at least adjusted to my needs. It came with a full set of animations that are just next level, and the monster looks sooo much better in the world. 
#
So the spider wasn't the first idea, but I am keeping it. The Arachne race was a little bit harder since you practically need to combine the upper body's animation from a human and the rest of the spider's skeleton. That proved to be impossible for me. After three days, I just made my own version of Arachnes, which have the spider legs attached to their back. They can use them offensively, and they are somewhat responsive to the movement of their hands, but it looks fine and a little bit scary, so I think it's okay to leave it like that. I even made it possible for them to wear armor. Specifically, they can be naked, wear ninja armor, or wear nomad armor. They will reside only in the desert biome, and they will have both ranged attacks with the bow and some cool melee strikes with their spider legs. So, of course, the AI will be a little more complicated, but most of it is already working. I will also group them with the basic spiders, which I have made larger and really fast. So while you are fighting (or running away from) a spider, the Arachnes will shoot you from a distance. These fights will present a harder experience and some challenge. 
#
![image](https://cdn.discordapp.com/attachments/980416693094453268/1128780561427730542/image.png)
#
## Weapons redefined 
Also, I have remodeled the weapons. Most of them are currently un-equippable, but I have added a lot of new variants, and I feel good about them. Especially the ranged steampunk guns, they turned out really nice, especially the rifle and the flamethrower. Each weapon "type" will also have its own set of combat movements.
#
![image](https://cdn.discordapp.com/attachments/980416693094453268/1125197541055664209/image.png)
![image](https://cdn.discordapp.com/attachments/980416693094453268/1125197540191649903/image.png)
![image](https://cdn.discordapp.com/attachments/980416693094453268/1125197540736901232/image.png)
![image](https://cdn.discordapp.com/attachments/980416693094453268/1125197541319917698/image.png)
#
## Building redefined
In a similar fashion, I have also remodeled the buildings. Most of them are just my older models, which I have cleared out, remeshed, and retextured to be more optimized for my game and the whole new design. All of the buildings are fully walkable for both players and the AI, so NPCs can freely walk between the building levels via stairs, etc. The player can also jump out of the windows or from the rooftops.
#
![image](https://cdn.discordapp.com/attachments/980416693094453268/1129889686891020351/image.png)
![image](https://cdn.discordapp.com/attachments/980416693094453268/1130217822031712366/image.png)
![image](https://cdn.discordapp.com/attachments/980416693094453268/1130245217237352588/image.png)
![image](https://cdn.discordapp.com/attachments/980416693094453268/1130245976632856577/image.png)
#
That's it. Thank you for reading :)
#
---
#
[Youtube](https://www.youtube.com/c/ViktorBřenekYT)
[Discord](https://discord.com/invite/2Uj6N5N)
