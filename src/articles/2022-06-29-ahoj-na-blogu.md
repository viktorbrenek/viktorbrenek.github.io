---
title: Vítám tě na mém blogu
description: "Obecný pokec o smyslu života a tohoto blogu."
ogImage: talk
lang: cz
tags:
  - Talk
---

Ahoj. Tohle je první článek na mém blogu ve kterém Vám popíšu jeho smysl 
a obsah. A vzhledem k tomu, že nemám pocit, že by se o blog někdo dvakrát 
zajímal, tak ho budu psát tak, aby zajímal především mě a sloužil jako knihovna 
vědomostí o designu, umění, gamedevu, programování a dalších věcech, kterým se věnuji.

## Každý článek něco usefull?

Jak podnadpis napovídá budu se každý článek přidat něco do mlýna.
Co tak začít s tím jak funguje tenhle web? Na to by Vám odpověděl lépe můj kolega Daniel Hruška.
Prozatím si třeba přečti tohle [`Minimal-viable-blog`](https://github.com/dennisreimann/gulp-mvb) 
Jak to napojit se dozvíš třeba v nějakém dalším článku a nebo na blogu kolegy. (odkaz dodám)
#
Vzhledem k tomu, že já s kodérstvím víceméně začínám, tak alepsoň nasdílím jak jsem docílil 
(dle mého) cool efektu s řazením článků dle tagů a jejich rozklikání a to pouze pomocí PUG/LESS
Samotný výpis tagů už řeší javascript, který pochází z výšše uvedeného githubu. 
#
PUG/HTML
```js
nav.nav(role='navigation')
  ul.nav__list
    each tag, name in mvb.groupedArticles.byTag 
      br
      label.task__tag2.task__tag--copyright
        input#group-1(type='checkbox' hidden='')
        label.shrink
          span.fa.fa-angle-right= name
        ul.group-list  
          each article in tag
            br 
            li
              a.articlelink(href=`articles/${article.id}.html`)= article.title
```
#
Stylování už je samozřejmě na každém, ale můj výsledek si můžete prohlídnout samy.
Stylování a kódování určitě nebude priorita tohoto webu. Spíše se zaměříme na C#
programování a práci s Blenderem. Nicméně na pár střípků se těšit určitě můžete. 
#
Teď už čus příště. 
