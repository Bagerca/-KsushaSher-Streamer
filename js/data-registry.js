/* js/data-registry.js */

/**
 * ГИБРИДНЫЙ ПРОВАЙДЕР ДАННЫХ (Data Registry)
 * Обеспечивает 100% работоспособность сайта при запуске локально через file://
 * Хранит эталонные копии всех JSON манифестов в компактном виде.
 */
export const DATA_REGISTRY = {
    'games.json': [
        { id: "bendy-franchise", format: "collection", items: [
            { id: "bendy-ink-machine", title: "Bendy and the Ink Machine", rating: 0, description: "...", image: "assets/images/games/bendy-ink-machine.jpg", status: "on-hold", videos: ["https://youtu.be/q97ulxbP--E", "https://youtu.be/zdhJNB2HyZo", "https://youtu.be/-t4TN1H8e70"] },
            { id: "bendy-dark-revival", title: "Bendy and the Dark Revival", rating: 0, description: "...", image: "assets/images/games/bendy-dark-revival.jpg", status: "on-hold", videos: ["https://youtu.be/-6XlV09QirY", "https://youtu.be/sJX6oEBSaqE", "https://youtu.be/TfpTg_OCe4g", "https://youtu.be/_f0DXJ2psus"] },
            { id: "bendy-secrets-of-the-machine", title: "Bendy: Secrets of the Machine", rating: 0, description: "...", image: "assets/images/games/bendy-secrets-of-the-machine.jpg", status: "on-hold" },
            { id: "bendy-lone-wolf", title: "Bendy: Lone Wolf", rating: 0, description: "...", image: "assets/images/games/bendy-lone-wolf.jpg", status: "on-hold" },
            { id: "boris-and-the-dark-survival", title: "Boris and the Dark Survival", rating: 0, description: "...", image: "assets/images/games/boris-and-the-dark-survival.jpg", status: "on-hold" }
        ]},
        { id: "hollow-knight-franchise", format: "collection", items: [
            { id: "hollow-knight", title: "Hollow Knight", rating: 0, description: "...", image: "assets/images/games/hollow-knight.png", status: "on-hold" },
            { id: "hollow-knight-silksong", title: "Hollow Knight: Silksong", rating: 3.0, description: "+ Приятная картинка. + Есть кооп. - Очень жеский геймплей для меня.", image: "assets/images/games/hollow-knight-silksong.png", status: "dropped", videos: ["https://youtu.be/JPGKia9djuA", "https://youtu.be/deMaQZA9Vc4", "https://youtu.be/7xn2mNWE4Pw"] }
        ]},
        { id: "silent-hill-franchise", format: "collection", items: [
            { id: "silent-hill-f", title: "Silent Hill f", rating: 2.0, description: "+ Красивая картинка. + Интересный сюжет. - Отвратительная боевка. - Нетипичный Сайлент Хилл, двоякие ощущения.", image: "assets/images/games/silent-hill-f.png", status: "completed", videos: ["https://youtu.be/M-xk2GDhAhc", "https://youtu.be/L7KIwjXuCao", "https://youtu.be/NdSCznUi0ek", "https://youtu.be/Bf2IdJrUPmY", "https://youtu.be/EBaPeWK11BU", "https://youtu.be/IMz4cLhEQzE", "https://youtu.be/PUUXPIuBVT4", "https://youtu.be/r2CsTzv1bKE"] },
            { id: "silent-hill-2-remake", title: "Silent Hill 2 Remake", rating: 0, description: "...", image: "assets/images/games/silent-hill-2-remake.jpg", status: "on-hold", videos: ["https://youtu.be/HUrp1CqdYBs", "https://youtu.be/e-e6Zf2AliQ", "https://youtu.be/DN22y-dkdwc", "https://youtu.be/aXUA4mtTNRo", "https://youtu.be/CBm6Fl_WLBc", "https://youtu.be/cDfAqPRQEh0", "https://youtu.be/6XrTOFpBz_s", "https://youtu.be/zM2jyZVGrak", "https://youtu.be/nKqOxETyM18"] }
        ]},
        { id: "portal-franchise", format: "collection", items: [
            { id: "portal", title: "Portal", rating: 0, description: "...", image: "assets/images/games/portal.jpg", status: "on-hold", videos: ["https://youtu.be/dM2jrCpQcls"] },
            { id: "portal-2", title: "Portal 2", rating: 0, description: "...", image: "assets/images/games/portal-2.jpg", status: "on-hold", videos: ["https://youtu.be/Tm6nA9wjniU", "https://youtu.be/wVCD14BpYcs", "https://youtu.be/1tjJOUPh4DI"] }
        ]},
        { id: "little-nightmares-franchise", format: "collection", items: [
            { id: "little-nightmares", title: "Little Nightmares", rating: 0, description: "...", image: "assets/images/games/little-nightmares.jpg", status: "on-hold", videos: ["https://youtu.be/hJ5ixMGwQIE", "https://youtu.be/uTbIGs0qAkY"] },
            { id: "little-nightmares-2", title: "Little Nightmares II", rating: 0, description: "...", image: "assets/images/games/little-nightmares-2.jpg", status: "on-hold", videos: ["https://youtu.be/LyKYbsFIbto", "https://youtu.be/8yk1jbHfYp0", "https://youtu.be/SRRdPUNK_pE"] },
            { id: "little-nightmares-3", title: "Little Nightmares III", rating: 0, description: "...", image: "assets/images/games/little-nightmares-3.jpg", status: "on-hold", videos: ["https://youtu.be/BjS0l69SZ7E", "https://youtu.be/HoEveNotp2Q", "https://youtu.be/9xS3MqhBn-Q"] }
        ]},
        { id: "creepy-tale-franchise", format: "collection", items: [
            { id: "creepy-tale", title: "Creepy Tale", rating: 0, description: "...", image: "assets/images/games/creepy-tale.jpg", status: "on-hold", videos: ["https://youtu.be/KcfE3lCMb3Y"] },
            { id: "creepy-tale-2", title: "Creepy Tale 2", rating: 0, description: "...", image: "assets/images/games/creepy-tale-2.jpg", status: "on-hold", videos: ["https://youtu.be/9ME00BDSlRU"] },
            { id: "creepy-tale-3", title: "Creepy Tale 3", rating: 0, description: "...", image: "assets/images/games/creepy-tale-3.jpg", status: "on-hold", videos: ["https://youtu.be/0wp5Xg0Tt0k", "https://youtu.be/dtu-pYk219M"] },
            { id: "creepy-tale-some-other-place", title: "Creepy Tale Some Other Place", rating: 0, description: "...", image: "assets/images/games/creepy-tale-some-other-place.jpg", status: "on-hold", videos: ["https://youtu.be/8W-W1lnlVUw"] }
        ]},
        { id: "outlast-franchise", format: "collection", items: [
            { id: "outlast", title: "Outlast", rating: 0, description: "...", image: "assets/images/games/outlast.jpg", status: "on-hold", videos: ["https://youtu.be/TkwjrMPd2lo", "https://youtu.be/8htTEED3v3g"] },
            { id: "outlast-2", title: "Outlast 2", rating: 0, description: "...", image: "assets/images/games/outlast-2.jpg", status: "on-hold", videos: ["https://youtu.be/w_X2_E2XKSc", "https://youtu.be/P9Vv6cMMdKk", "https://youtu.be/khAyzBKDfgs"] }
        ]},
        { id: "the-floor-above", title: "The Floor Above", rating: 0, description: "...", image: "assets/images/games/the-floor-above.jpg", status: "completed", videos: ["https://youtu.be/KBkcxV_T2DI"] },
        { id: "stick-fight-the-game", title: "Stick Fight: The Game", rating: 0, description: "...", image: "assets/images/games/stick-fight-the-game.jpg", status: "completed", videos: ["https://youtu.be/o1QJ3pcpeUM", "https://youtu.be/6zFv5iVlk6Y"] },
        { id: "supernatural-the-game", title: "Supernatural: The Game", rating: 4.0, description: "+ Я фАнАтКа, мне зашло. + Озвучка гг, как в сериале. + Есть небольшая привязка к сериалу. - Лагает хорошо, но это простительно. - Короткий сюжет, но я жду полнометражную игру.", image: "assets/images/games/supernatural-the-game.jpg", status: "completed", videos: ["https://youtu.be/f2Mbj35lirQ"] },
        { id: "cursed-digicam", title: "Cursed Digicam", rating: 5.0, description: "+ Хорошие скримеры. + Хороший сюжет. + Есть даже рофловые моменты. + Даже есть головоломки. - Минус в том, что их нет.", image: "assets/images/games/cursed-digicam.jpg", status: "completed", videos: ["https://youtu.be/9jQw2NCywLU"] },
        { id: "the-maid", title: "The Maid", rating: 3.0, description: "+ Хорошие скримеры. - Затянутый геймплей, постоянно ходишь туда сюда в поисках того сего.", image: "assets/images/games/the-maid.jpg", status: "completed", videos: ["https://youtu.be/zwQGqgZrBKo"] },
        { id: "the-cabin-factory", title: "The Cabin Factory", rating: 4.0, description: "+ Есть взаимодействие с чатом во время игры. + Хорошие скримеры. - Короткий сюжет.", image: "assets/images/games/the-cabin-factory.jpg", status: "completed", videos: ["https://youtu.be/qZqk1O8p9BU"] },
        { id: "vacation-cafe-simulator", title: "Vacation Cafe Simulator", rating: 4.0, description: "+ Красивые виды. + Можно плавать под водой. + Приятный и не сложный геймплей. - Много багов в демке и мало функций, поэтому ждем полную версию.", image: "assets/images/games/vacation-cafe-simulator.jpg", status: "playing", videos: ["https://youtu.be/8vjTPSYiOuM"] },
        { id: "the-forest", title: "The Forest", rating: 4.0, description: "+ Залипательная песочница. + Есть chaos triks (можно добавлять плюшки за баллы канала или донаты). - Короткий сюжет, но интересный.", image: "assets/images/games/the-forest.png", status: "completed", videos: ["https://youtu.be/NooBjWBm8oE", "https://youtu.be/TMhmn2_8grg", "https://youtu.be/7juQGdOgNo8", "https://youtu.be/PEhKsp41-9I", "https://youtu.be/fUPisWeQTb0", "https://youtu.be/ZhgXTJqAlkU", "https://youtu.be/EMoiVOpJ_xY", "https://youtu.be/6CwYiCgorfU", "https://youtu.be/YYN2mUoStmU"] },
        { id: "dead-island-2", title: "Dead Island 2", rating: 5.0, description: "+ Сочная картинка. + Залипательное лутание. + Классная музыка. + Хорошая разрушаемость зомби. - Звуки разрушения мебели не очень подходящие.", image: "assets/images/games/dead-island-2.png", status: "completed", videos: ["https://youtu.be/_LQRER2rOWg", "https://youtu.be/f7DoiosG1dI", "https://youtu.be/C3ZrneATygY", "https://youtu.be/m-xfz0YISEg", "https://youtu.be/qrRPE5mdCLU", "https://youtu.be/4nWV0EqxfGA", "https://youtu.be/2DiQEA11Vps", "https://youtu.be/QZKG8PHAxsA", "https://youtu.be/56AmmuvlppE"] },
        { id: "repo", title: "R.E.P.O.", rating: 5.0, description: "+ Прикольные монстры. + Залипательное лутание. + Есть chaos triks (можно добавлять плюшки за баллы канала или донаты). - В последнее время ужасные пинги.", image: "assets/images/games/repo.png", status: "playing", videos: ["https://youtu.be/INxLtYGWWNI", "https://youtu.be/-Io-aMBFqWg", "https://youtu.be/UKgEd3xHn5g", "https://youtu.be/BUkbzbvlQ44", "https://youtu.be/oudyoE8akHk", "https://youtu.be/PdA7Ebci5lA", "https://youtu.be/YppmFYy0PSk", "https://youtu.be/BuWCaR84mII", "https://youtu.be/BHAVieCDEIA", "https://youtu.be/-cvftERq0Tk", "https://youtu.be/wj6rTHURCzc", "https://youtu.be/2mIbavnsQdQ", "https://youtu.be/lg2ZUkK4yz4", "https://youtu.be/ToQK7hLk-tQ", "https://youtu.be/5-UY3E8XNow", "https://youtu.be/5gLK5O04BRw", "https://youtu.be/sX5NW9QAq_4"] },
        { id: "unturned", title: "Unturned", rating: 4.0, description: "+ Залипательная боевка. + Приятный геймплей. + Есть кооп. - Жуть какая долгая загрузка.", image: "assets/images/games/unturned.png", status: "playing", videos: ["https://youtu.be/rzfnAtjE4as", "https://youtu.be/SMsvjKDwdZw", "https://youtu.be/F1nUsoEGR6U", "https://youtu.be/LJa-1BoEbMc"] },
        { id: "bad-cheese", title: "Bad Cheese", rating: 0, description: "...", image: "assets/images/games/bad-cheese.jpg", status: "completed", videos: ["https://youtu.be/PIyCxvZzeDA"] },
        { id: "state-of-decay-2", title: "State of Decay 2", rating: 0, description: "...", image: "assets/images/games/state-of-decay-2.jpg", status: "dropped", videos: ["https://youtu.be/4V4y8rO75mA"] },
        { id: "fuck-you-witch", title: "Fuck You Witch", rating: 0, description: "...", image: "assets/images/games/fuck-you-witch.jpg", status: "completed", videos: ["https://youtu.be/07lzMJrVDjg"] },
        { id: "lethal-company", title: "Lethal Company", rating: 0, description: "...", image: "assets/images/games/lethal-company.png", status: "playing", videos: ["https://youtu.be/8rQTRqSYB9I", "https://youtu.be/poR5ososvEw", "https://youtu.be/oGM9v8Mx_mI", "https://youtu.be/yzZkGAWhuaE", "https://youtu.be/hVI6wmxfDXw", "https://youtu.be/OCBMaHUegZ4", "https://youtu.be/spYKfCO6G7Q", "https://youtu.be/7YhFVjOU2-w", "https://youtu.be/QDvf0aRlnjM", "https://youtu.be/pjLLbazxijc", "https://youtu.be/xnyfzVJ_ofU", "https://youtu.be/jRCkXl96YgY", "https://youtu.be/okRrZtWBv7A", "https://youtu.be/t2zId2MtJRc", "https://youtu.be/lLdpUbp4Q2E", "https://youtu.be/YhZJKp--_Vw", "https://youtu.be/Sperc4ypFBk", "https://youtu.be/BEBprQ6k8-k", "https://youtu.be/VKgIqqQ-uzg", "https://youtu.be/x_d95KJdKuI", "https://youtu.be/ZdM9xaKtEmk", "https://youtu.be/_AZbMERsnr0", "https://youtu.be/dC1NjraQAwI"] },
        { id: "unmourned", title: "Unmourned", rating: 0, description: "...", image: "assets/images/games/unmourned.jpg", status: "completed", videos: ["https://youtu.be/ytz5jMFVGdQ", "https://youtu.be/vih6bH6ebSo"] },
        { id: "bioshock-infinite", title: "BioShock Infinite", rating: 4.0, description: "+ Красивая графика. + Расслабляющая стрелялка. + Перемещение во времени для Геймплея это интересно. - Сложный сюжет, пока не совсем понял что к чему и почему.", image: "assets/images/games/bioshock-infinite.png", status: "completed", videos: ["https://youtu.be/KsBProOxvpY", "https://youtu.be/wvlF0sBKpgA", "https://youtu.be/mFQjB_5FQNs", "https://youtu.be/cXXcKHYQJ2c", "https://youtu.be/jBobUycOKEM"] },
        { id: "gris", title: "GRIS", rating: 0, description: "...", image: "assets/images/games/gris.jpg", status: "on-hold", videos: ["https://youtu.be/gmkLzOrd_jo"] },
        { id: "content-warning", title: "Content Warning", rating: 0, description: "...", image: "assets/images/games/content-warning.jpg", status: "on-hold" },
        { id: "minecraft", title: "Minecraft", rating: 0, description: "...", image: "assets/images/games/minecraft.jpg", status: "on-hold", videos: ["https://youtu.be/itXWGMxoTxE", "https://youtu.be/uI0wdrz0SPU", "https://youtu.be/BOPKlz6H6dI", "https://youtu.be/nfbCKaSHfuY", "https://youtu.be/6vsbRs_vpeo", "https://youtu.be/PwPCyw76qEE", "https://youtu.be/18ziK9xbQyQ", "https://youtu.be/MXrwXfB_FB4", "https://youtu.be/aPCqHH1w17Y", "https://youtu.be/8-E6gVpX5Ws", "https://youtu.be/DPq-_vxUBBI", "https://youtu.be/2c9LXAQZAg8", "https://youtu.be/CdXQo8EiuO4", "https://youtu.be/_HzVU1BM95U", "https://youtu.be/iLGzg84FLic", "https://youtu.be/LBdqtqepIms", "https://youtu.be/7Q995i0dPkg"] },
        { id: "cs2", title: "Counter-Strike 2", rating: 0, description: "...", image: "assets/images/games/cs2.jpg", status: "on-hold", videos: ["https://youtu.be/TOzV2MFPWM4"] },
        { id: "sally-face", title: "Sally Face", rating: 0, description: "...", image: "assets/images/games/sally-face.jpg", status: "on-hold", videos: ["https://youtu.be/VXiSwhhLFGs", "https://youtu.be/M61tnKMqQ_c", "https://youtu.be/lg8l1kWB9vs", "https://youtu.be/ub2K9t7_7z0"] },
        { id: "beholder", title: "Beholder", rating: 0, description: "...", image: "assets/images/games/beholder.png", status: "on-hold" },
        { id: "mouthwashing", title: "Mouthwashing", rating: 0, description: "...", image: "assets/images/games/mouthwashing.jpg", status: "on-hold", videos: ["https://youtu.be/Fw2uuw4dGjg"] },
        { id: "cuphead", title: "Cuphead", rating: 0, description: "...", image: "assets/images/games/cuphead.jpg", status: "on-hold" },
        { id: "buckshot-roulette", title: "Buckshot Roulette", rating: 0, description: "...", image: "assets/images/games/buckshot-roulette.jpg", status: "on-hold" },
        { id: "undertale", title: "Undertale", rating: 0, description: "...", image: "assets/images/games/undertale.jpg", status: "on-hold" },
        { id: "vrchat", title: "VRChat", rating: 0, description: "...", image: "assets/images/games/vrchat.png", status: "on-hold" },
        { id: "alice-madness-returns", title: "Alice: Madness Returns", rating: 0, description: "...", image: "assets/images/games/alice-madness-returns.jpg", status: "on-hold" },
        { id: "abyssus", title: "Abyssus", rating: 0, description: "...", image: "assets/images/games/abyssus.jpg", status: "on-hold" },
        { id: "helltaker", title: "Helltaker", rating: 0, description: "...", image: "assets/images/games/helltaker.png", status: "on-hold" },
        { id: "valorant", title: "Valorant", rating: 0, description: "...", image: "assets/images/games/valorant.png", status: "on-hold", videos: ["https://youtu.be/70cQdUmv1qs"] },
        { id: "tomodachi-life-living-the-dream", title: "Tomodachi Life: Living the Dream", rating: 0, description: "...", image: "assets/images/games/tomodachi-life.jpg", status: "on-hold" },
        { id: "xenofeels", title: "Xenofeels", rating: 0, description: "...", image: "assets/images/games/xenofeels.jpg", status: "on-hold" },
        { id: "war-thunder", title: "War Thunder", rating: 0, description: "...", image: "assets/images/games/war-thunder.jpg", status: "on-hold" },
        { id: "dome-keeper", title: "Dome Keeper", rating: 0, description: "...", image: "assets/images/games/dome-keeper.jpg", status: "on-hold" },
        { id: "subnautica", title: "Subnautica", rating: 0, description: "...", image: "assets/images/games/subnautica.jpg", status: "on-hold", videos: ["https://youtu.be/J4mTX2b8zTk", "https://youtu.be/WtC7yq_oKmo"] },
        { id: "tiny-bunny", title: "Tiny Bunny", rating: 0, description: "...", image: "assets/images/games/tiny-bunny.jpg", status: "completed", videos: ["https://youtu.be/EJUHchID_aI", "https://youtu.be/Q8N5ftORIpc", "https://youtu.be/Rkip64Eti6E"] },
        { id: "machinika-museum", title: "Machinika: Museum", rating: 0, description: "...", image: "assets/images/games/machinika-museum.jpg", status: "on-hold", videos: ["https://youtu.be/RgdznrgDo64"] },
        { id: "poppy-playtime", title: "Poppy Playtime", rating: 0, description: "...", image: "assets/images/games/poppy-playtime.jpg", status: "on-hold", videos: ["https://youtu.be/pjOtyK5XP1Y", "https://youtu.be/dGYqzBtaQIU", "https://youtu.be/x9s2fXhuWJ4"] },
        { id: "scp-secret-laboratory", title: "SCP: Secret Laboratory", rating: 0, description: "...", image: "assets/images/games/scp-secret-laboratory.jpg", status: "on-hold", videos: ["https://youtu.be/5OicfmGP_iI"] },
        { id: "scorn", title: "Scorn", rating: 0, description: "...", image: "assets/images/games/scorn.jpg", status: "on-hold" },
        { id: "sigame", title: "SIGame", rating: 0, description: "...", image: "assets/images/games/sigame.jpg", status: "on-hold" },
        { id: "spiderheck", title: "SpiderHeck", rating: 0, description: "...", image: "assets/images/games/spiderheck.jpg", status: "on-hold" },
        { id: "stalker-soc", title: "S.T.A.L.K.E.R.: Shadow of Chernobyl", rating: 0, description: "...", image: "assets/images/games/stalker-soc.jpg", status: "on-hold" },
        { id: "fused-240", title: "Fused 240", rating: 0, description: "...", image: "assets/images/games/fused-240.jpg", status: "on-hold", videos: ["https://youtu.be/tIc8nxi4yyo"] },
        { id: "for-sale", title: "For Sale", rating: 0, description: "...", image: "assets/images/games/for-sale.jpg", status: "on-hold", videos: ["https://youtu.be/KTucW6rvkHc"] },
        { id: "the-hole", title: "The Hole", rating: 0, description: "...", image: "assets/images/games/the-hole.jpg", status: "on-hold", videos: ["https://youtu.be/UZ1UAptwgWo"] },
        { id: "borderlands-2", title: "Borderlands 2", rating: 0, description: "...", image: "assets/images/games/borderlands-2.jpg", status: "on-hold", videos: ["https://youtu.be/vSTlwArmb50", "https://youtu.be/-upzBtAf32A", "https://youtu.be/B7kk-OH9t1s", "https://youtu.be/3LY9qNEa6tY"] },
        { id: "the-inn-sanity", title: "The Inn-Sanity", rating: 0, description: "...", image: "assets/images/games/the-inn-sanity.jpg", status: "on-hold", videos: ["https://youtu.be/475e5oxzqyE"] },
        { id: "rv-there-yet", title: "Rv there yet", rating: 0, description: "...", image: "assets/images/games/rv-there-yet.jpg", status: "on-hold", videos: ["https://youtu.be/Ac-QTtheNvM"] },
        { id: "who-am-i", title: "Who Am I?", rating: 0, description: "...", image: "assets/images/games/who-am-i.jpg", status: "on-hold", videos: ["https://youtu.be/jvDpFpa65eQ"] },
        { id: "whos-your-daddy", title: "Who's Your Daddy?", rating: 0, description: "...", image: "assets/images/games/whos-your-daddy.jpg", status: "on-hold", videos: ["https://youtu.be/Z4LzKBxQh4Q"] },
        { id: "pit-of-goblin", title: "Pit of Goblin", rating: 0, description: "...", image: "assets/images/games/pit-of-goblin.jpg", status: "on-hold", videos: ["https://youtu.be/zeiFzCIl0k0", "https://youtu.be/A1RLqXgMriM", "https://youtu.be/qVKwl12SSP4"] },
        { id: "skuf-fishing", title: "Скуф на рыбалке", rating: 0, description: "...", image: "assets/images/games/skuf-fishing.jpg", status: "on-hold", videos: ["https://youtu.be/1M5CndRnfoU"] },
        { id: "the-boba-teashop", title: "The Boba Teashop", rating: 0, description: "...", image: "assets/images/games/the-boba-teashop.jpg", status: "on-hold", videos: ["https://youtu.be/sworfDXasVs"] },
        { id: "kiosk", title: "Kiosk", rating: 0, description: "...", image: "assets/images/games/kiosk.jpg", status: "on-hold", videos: ["https://youtu.be/xfESYCTnazc"] },
        { id: "banned-tapes", title: "Banned Tapes", rating: 0, description: "...", image: "assets/images/games/banned-tapes.jpg", status: "on-hold", videos: ["https://youtu.be/V_hR_EklpoY"] },
        { id: "untitled-goose-game", title: "Untitled Goose Game", rating: 0, description: "...", image: "assets/images/games/untitled-goose-game.jpg", status: "on-hold", videos: ["https://youtu.be/N6edBDUUyOE", "https://youtu.be/n50v827tqho"] },
        { id: "burger-shift", title: "Burger Shift Team Rush Prologue", rating: 0, description: "...", image: "assets/images/games/burger-shift.jpg", status: "on-hold", videos: ["https://youtu.be/TtAdMzh2UUw", "https://youtu.be/srYTVe9AleQ", "https://youtu.be/yC9IFd7S9yg"] },
        { id: "mimesis", title: "MIMESIS", rating: 0, description: "...", image: "assets/images/games/mimesis.jpg", status: "on-hold", videos: ["https://youtu.be/YCQ_mNjtjNo"] },
        { id: "abzu", title: "ABZÛ", rating: 0, description: "...", image: "assets/images/games/abzu.jpg", status: "on-hold", videos: ["https://youtu.be/dlCKL4M0maE"] },
        { id: "parasocial", title: "Parasocial", rating: 0, description: "...", image: "assets/images/games/parasocial.jpg", status: "on-hold", videos: ["https://youtu.be/Xc88fabJKG4"] },
        { id: "fortnite", title: "Fortnite", rating: 0, description: "...", image: "assets/images/games/fortnite.jpg", status: "on-hold", videos: ["https://youtu.be/Gi7RfRKRiBg"] },
        { id: "jisatsu", title: "Jisatsu", rating: 0, description: "...", image: "assets/images/games/jisatsu.jpg", status: "on-hold", videos: ["https://youtu.be/ahGQs7R6rXw"] },
        { id: "shinkansen-0", title: "Shinkansen 0", rating: 0, description: "...", image: "assets/images/games/shinkansen-0.jpg", status: "on-hold", videos: ["https://youtu.be/ZOLRHCP1MNA"] },
        { id: "the-bathhouse", title: "The Bathhouse", rating: 0, description: "...", image: "assets/images/games/the-bathhouse.jpg", status: "on-hold", videos: ["https://youtu.be/3ra-3Dchhek", "https://youtu.be/PcnYwMW_ZNw"] },
        { id: "winx-club", title: "Winx Club", rating: 0, description: "...", image: "assets/images/games/winx-club.jpg", status: "on-hold", videos: ["https://youtu.be/trXit5Uzuw4"] },
        { id: "layers-of-fear", title: "Layers of Fear", rating: 0, description: "...", image: "assets/images/games/layers-of-fear.jpg", status: "on-hold", videos: ["https://youtu.be/6HBlwKjlS0E"] },
        { id: "indika", title: "Indika", rating: 0, description: "...", image: "assets/images/games/indika.jpg", status: "on-hold", videos: ["https://youtu.be/K8mtR3tgOU0"] },
        { id: "pine-harbor", title: "Pine Harbor", rating: 0, description: "...", image: "assets/images/games/pine-harbor.jpg", status: "on-hold", videos: ["https://youtu.be/wGGrDZlICSc"] },
        { id: "burglin-gnomes", title: "Burglin' Gnomes", rating: 0, description: "...", image: "assets/images/games/burglin-gnomes.jpg", status: "on-hold", videos: ["https://youtu.be/HHzTod1PsFk", "https://youtu.be/ES8qE_PUPug", "https://youtu.be/ax8mOYqvQPk", "https://youtu.be/RQCcdSrWQIw", "https://youtu.be/tp5sVaZSsg4", "https://youtu.be/bfevuBOChqg", "https://youtu.be/FsYZou_LZJk"] },
        { id: "no-im-not-a-human", title: "No, I'm Not a Human", rating: 0, description: "...", image: "assets/images/games/no-im-not-a-human.jpg", status: "on-hold", videos: ["https://youtu.be/uEhfWJhVuvE", "https://youtu.be/bEWiDd5pnr8"] },
        { id: "kholat", title: "Kholat", rating: 0, description: "...", image: "assets/images/games/kholat.jpg", status: "on-hold", videos: ["https://youtu.be/F8dlfFRtRRY", "https://youtu.be/E02aaBGOz4Y"] },
        { id: "sons-of-the-forest", title: "Sons Of The Forest", rating: 0, description: "...", image: "assets/images/games/sons-of-the-forest.jpg", status: "on-hold", videos: ["https://youtu.be/PEhKsp41-9I", "https://youtu.be/fUPisWeQTb0"] },
        { id: "resident-evil-revelations-2", title: "Resident Evil Revelations 2", rating: 0, description: "...", image: "assets/images/games/resident-evil-revelations-2.jpg", status: "on-hold", videos: ["https://youtu.be/bB0n_GzF6E0", "https://youtu.be/PBZhLoLO9Ig", "https://youtu.be/Fz9IubVimfA"] },
        { id: "it-takes-two", title: "It Takes Two", rating: 0, description: "...", image: "assets/images/games/it-takes-two.jpg", status: "on-hold", videos: ["https://youtu.be/fTfefkTEaAE", "https://youtu.be/OOyhCmNbTnY", "https://youtu.be/f7r9blGTCX8", "https://youtu.be/Dr_SGlwnSr8"] }
    ],

    'movies.json': [
        { id: "garfield-collection", format: "collection", title: "Garfield / Гарфилд (Коллекция)", rating: 5.0, description: "+ Фильм из детства. + Прикольный сюжет. + Юмор нраится. + Там есть рыжий кот. - Не смогу сказать чего-то прям плохо т.к мультфильм из детства и вызывает только ностальгию и положительные эмоции.", status: "watched", items: [ { id: "garfield-1", title: "Garfield / Гарфилд", rating: 5.0, description: "...", image: "assets/images/movies/garfield-1.jpg", status: "watched" }, { id: "garfield-2", title: "Garfield: A Tail of Two Kitties / Гарфилд 2", rating: 5.0, description: "...", image: "assets/images/movies/garfield-2.jpg", status: "watched" } ]},
        { id: "shrek-2", title: "Shrek 2 / Шрек 2", rating: 5.0, description: "+ Мультик из детства. + Сочная графика. + Есть моменты для размышлений, но юмор позволяет не углубляться. - Не смогу сказать чего-то прям плохо т.к мультфильм из детства и вызывает только ностальгию и положительные эмоции.", image: "assets/images/movies/shrek-2.jpg", status: "watched" },
        { id: "shark-tale", title: "Shark Tale / Подводная братва", rating: 5.0, description: "+ Мультик из детства. + Сочная графика. + Люблю подводный мир. - Не смогу сказать чего-то прям плохо т.к мультфильм из детства и вызывает только ностальгию и положительные эмоции.", image: "assets/images/movies/shark-tale.jpg", status: "watched" },
        { id: "arcane", format: "collection", title: "Arcane / Аркейн", rating: 4.0, description: "+ Красивая и сочная рисованная графика. + Хорошая музыка. + Интересный сюжет. - Пара логических дыр (либо моя логика не ваша логика).", status: "watched", items: [ { id: "arcane-s1", title: "Arcane: Season 1 / Аркейн: 1 Сезон", rating: 4.0, description: "...", image: "assets/images/movies/arcane-s1.jpg" }, { id: "arcane-s2", title: "Arcane: Season 2 / Аркейн: 2 Сезон", rating: 4.0, description: "...", image: "assets/images/movies/arcane-s2.jpg" } ]},
        { id: "wild-robot", title: "The Wild Robot / Дикий робот", rating: 4.0, description: "+ Трогательный сюжет. + Пробивает на слёзы. + Приятная графика. - Иногда логичность возмущается, но редко.", image: "assets/images/movies/wild-robot.jpg", status: "watched" },
        { id: "gravity-falls", title: "Gravity Falls / Гравити Фолз", rating: 3.5, description: "+ Интересный сюжет (люблю теории заговора). + Легкое повествование. - Моментами слишком детский или глупый.", image: "assets/images/movies/gravity-falls.jpg", status: "watched" },
        { id: "indie-cross", title: "Indie Cross", rating: 3.5, description: "+ Прикольная задумка сюжета. + Вызывает ностальгию по пройденным играм. - Мало игр пройдено мной, от чего слегка теряешься в сюжете.", image: "assets/images/movies/indie-cross.jpg", status: "watched" },
        { id: "nine", title: "9 / Девять", rating: 2.5, description: "+ Приятная графика. + Приятное звуковое сопровождение. + Есть моменты для размышлений. - Есть логические несостыковки (либо я не понел).", image: "assets/images/movies/nine.jpg", status: "watched" },
        { id: "heroes-of-envell", title: "Heroes of Envell / Герои Энвелла", rating: 2.0, description: "+ Неплохой сюжет. - Рисовка слишком детская.", image: "assets/images/movies/heroes-of-envell.jpg", status: "dropped" },
        { id: "spider-man-noir", title: "Spider-Man Noir / Паук-Нуар", rating: 0, description: "...", image: "assets/images/movies/spider-man-noir.jpg", status: "on-hold" },
        { id: "lego-movie", title: "The LEGO Movie / ЛЕГО Фильм", rating: 0, description: "...", image: "assets/images/movies/lego-movie.jpg", status: "on-hold" },
        { id: "lego-batman", title: "The LEGO Batman Movie / Лего Фильм: Бэтмен", rating: 0, description: "...", image: "assets/images/movies/lego-batman.jpg", status: "on-hold" },
        { id: "ready-player-one", title: "Ready Player One / Первому игроку приготовиться", rating: 0, description: "...", image: "assets/images/movies/ready-player-one.jpg", status: "on-hold" },
        { id: "a-monster-in-paris", title: "A Monster in Paris / Монстр в Париже", rating: 0, description: "...", image: "assets/images/movies/a-monster-in-paris.jpg", status: "on-hold" }
    ],

    'schedule.json': {
        "schedule": [
            { day: "Понедельник", time: "Выходной", game: "Ксюша уехала к маме", description: "На этой неделе стримов не будет, встретимся совсем скоро!", highlighted: false },
            { day: "Вторник", time: "Выходной", game: "Ксюша уехала к маме", description: "Отдыхаем, общаемся и набираемся сил.", highlighted: false },
            { day: "Среда", time: "Выходной", game: "Ксюша уехала к маме", description: "Системы TETLA переведены в энергосберегающий режим.", highlighted: false },
            { day: "Четверг", time: "Выходной", game: "Ксюша уехала к маме", description: "Отличный повод пересмотреть записи прошлых стримов!", highlighted: false },
            { day: "Пятница", time: "Выходной", game: "Ксюша уехала к маме", description: "Не теряйте связь, все новости публикуются в Telegram.", highlighted: false },
            { day: "Суббота", time: "Выходной", game: "Ксюша уехала к маме", description: "Проводим выходные с пользой и теплом.", highlighted: false },
            { day: "Воскресенье", time: "Выходной", game: "Ксюша уехала к маме", description: "Подготовка к возвращению в штатный режим вещания.", highlighted: false }
        ]
    },

    'subscribers.json': [
        { id: "ksusha", name: "ksusha__sher", squadName: "Ksusha Sher", twitch: "ksusha__sher", role: "Creator / Streamer", createdAt: "2020-04-15", color: "#ff2d95", mainIcon: "fas fa-crown", typeIcon: "fas fa-star", avatarPath: "assets/images/ksusha.jpg", description: "Создательница этого хаоса и главная стримерша. Контролирует всё.", hasTierlist: true },
        { id: "tetla", name: "Tetlabot", twitch: "tetlabits", role: "fish", createdAt: "2021-08-06", color: "#319a24", mainIcon: "fas fa-fish", typeIcon: "fas fa-water", description: "Искусственный интеллект, контролирующий систему. Любит рыб." },
        { id: "bagerca", name: "BAGERcaa", squadName: "BAGERca", twitch: "bagercaa", role: "DEV / TECH", createdAt: "2022-01-23", color: "#ff4444", mainIcon: "fas fa-laptop-code", typeIcon: "fas fa-code", avatarPath: "assets/images/bagerca.jpg", description: "Архитектор этого хаоса и главный сектант Чернильного Демона. Уровень фанатизма по Bendy превышает системные нормы. Кодит на чистом энтузиазме и чернилах." },
        { id: "angel", name: "to_be_ang", squadName: "Angel", twitch: "to_be_ang", role: "The Shining Angel", createdAt: "2014-11-10", color: "#ff4504", mainIcon: "fas fa-sun", typeIcon: "fas fa-star", avatarPath: "assets/images/angel.jpg", description: "Элитный оперативник кооператива. Обладает запредельным скиллом и реакцией. Пока остальные пытаются понять тактику, она уже зачистила локацию." },
        { id: "kiriki", name: "kiriki_oni", squadName: "Kiriki", twitch: "kiriki_oni", role: "Neuro wave", createdAt: "", color: "#007bff", mainIcon: "fas fa-wave-square", typeIcon: "fas fa-music", avatarPath: "assets/images/kiriki.jpg", description: "Нейро-композитор и повелитель алгоритмов. Создает уникальную музыку с помощью нейросетей." },
        { id: "dragon", name: "dragonsmaddison", twitch: "dragonsmaddison", role: "DragonDildo", createdAt: "2021-11-01", color: "#ff000a", mainIcon: "fas fa-dragon", typeIcon: "fas fa-fire" },
        { id: "dark", name: "Darkl1us", twitch: "darkl1us", role: "Military Beer", createdAt: "2015-10-08", color: "#bd00ff", mainIcon: "fas fa-beer", typeIcon: "fas fa-medal" },
        { id: "nikita", name: "Nikitakgc", twitch: "nikitakgc", role: "Forest Expert", createdAt: "2025-09-29", color: "#2e8b57", mainIcon: "fas fa-tree", typeIcon: "fas fa-campground", description: "" },
        { id: "roma", name: "Roma99...", twitch: "roma99000000", role: "Orenburg Brother", createdAt: "", color: "#00ffff", mainIcon: "fas fa-city", typeIcon: "fas fa-user-friends", description: "" },
        { id: "raku6chka", name: "raku6chka", twitch: "raku6chka", role: "Irkutsk Brother", createdAt: "2021-11-18", color: "#17a2b8", mainIcon: "far fa-handshake", typeIcon: "fas fa-map-marker-alt" },
        { id: "hardwell", name: "h1rdwell", twitch: "h1rdwell", role: "Hard Worker", createdAt: "2017-02-23", color: "#e67e22", mainIcon: "fas fa-hammer", typeIcon: "fas fa-hard-hat" },
        { id: "ih1mkaaaa", name: "ih1mkaaaa", squadName: "ih1mka", twitch: "ih1mkaaaa", role: "Agent", createdAt: "2025-10-11", color: "#B21F1D", mainIcon: "fas fa-user", typeIcon: "fas fa-star" },
        { id: "apalonzv", name: "apalonzv", twitch: "apalonzv", role: "Agent", color: "#bd00ff", mainIcon: "fas fa-user", typeIcon: "fas fa-terminal", createdAt: "2021-06-04" },
        { id: "redfyr", name: "RedFyr", twitch: "redfyr", role: "Agent", color: "#ff4444", mainIcon: "fas fa-fire", typeIcon: "fas fa-star", createdAt: "2017-07-27" },
        { id: "wotfot", name: "Wotfot", twitch: "wotfot", role: "Agent", color: "#39ff14", mainIcon: "fas fa-eye", typeIcon: "fas fa-satellite-dish" },
        { id: "akipi20", name: "akipi20", twitch: "akipi20", role: "Agent", color: "#ffd700", mainIcon: "fas fa-bolt", typeIcon: "fas fa-microchip", createdAt: "2022-02-27" },
        { id: "svarshik_s1d", name: "svarshik_s1d", twitch: "svarshik_s1d", role: "Agent", color: "#e67e22", mainIcon: "fas fa-hard-hat", typeIcon: "fas fa-hammer", createdAt: "2025-05-08" },
        { id: "pristalihe", name: "pristalihe", twitch: "pristalihe", role: "Agent", color: "#00ffff", mainIcon: "fas fa-ghost", typeIcon: "fas fa-skull", createdAt: "2021-07-08" },
        { id: "ayyysms", name: "ayyysms", twitch: "ayyysms", role: "Agent", color: "#ff2d95", mainIcon: "fas fa-comment-dots", typeIcon: "fas fa-terminal", createdAt: "2025-11-28" },
        { id: "me1leve", name: "Me1leve", twitch: "me1leve", role: "Agent", color: "#ff8c00", mainIcon: "fas fa-heart", typeIcon: "fas fa-music", createdAt: "2026-03-06" },
        { id: "rater_12355", name: "rater_12355", twitch: "rater_12355", role: "Agent", color: "#00ccff", mainIcon: "fas fa-database", typeIcon: "fas fa-memory", createdAt: "2024-10-25" },
        { id: "cotara_gold", name: "cotara_gold", twitch: "cotara_gold", role: "Agent", color: "#ffd700", mainIcon: "fas fa-sack-dollar", typeIcon: "fas fa-medal", createdAt: "2022-01-22" }
    ],

    'suggestions-games.json': [
        { title: "Awaria", description: "Короткая игра от создателя Helltaker. Чиним генераторы в проклятых туннелях, избегая монстров.", image: "https://cdn2.steamgriddb.com/grid/00b1f760f5b1831e2495c8bb1e99c38e.png", suggestedBy: "BAGERca", videos: ["https://youtu.be/Nz1NpnYvpi0"] },
        { title: "Atomic Heart", description: "Шикарный шутер в сеттинге альтернативного СССР. Роботы, полимеры, близняшки и мощный саундтрек от Мика Гордона.", image: "https://cdn2.steamgriddb.com/grid/53f249d8ba9cfab41868236dead77aba.jpg", suggestedBy: "BAGERca", videos: ["https://youtu.be/0UBiw1xkHl8"] },
        { title: "Cakey's Twisted Bakery", description: "Я сам хз че за игра", image: "https://cdn2.steamgriddb.com/grid/6ee1d3853f229f82f4663f21ea6edf86.png", suggestedBy: "BAGERca", videos: ["https://youtu.be/aoCceHy0Hb8"] },
        { title: "Deepest Sword", description: "Игра про большие и не очень мечи", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1647160/library_600x900_2x.jpg", suggestedBy: "BAGERca", videos: ["https://youtu.be/paHXSEt0d1A"] },
        { title: "Beholder: Conductor", description: "Очередной шедевр в тоталитарном мире", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2825530/library_600x900_2x.jpg", suggestedBy: "BAGERca", videos: ["https://youtu.be/j81HG7028NA9"] },
        { title: "BioShock Collection", description: "Легендарная серия игр", suggestedBy: "BAGERca", items: [ { title: "BioShock Remastered", description: "Первая часть шедевра", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/409710/library_600x900_2x.jpg", videos: ["https://youtu.be/okEmFtH_qgA"] }, { title: "BioShock 2 Remastered", description: "Вторая часть шедевра", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/409720/library_600x900_2x.jpg", videos: ["https://youtu.be/gd-OSIOEfN8"] } ]},
        { title: "Bloons TD 6", description: "Обезьяны против шариков", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/960090/library_600x900_2x.jpg", suggestedBy: "BAGERca", videos: ["https://youtu.be/cRDbFoDsQ6M"] },
        { title: "CARRION", description: "Ты монстр. Жри людей.", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/953490/library_600x900_2x.jpg", suggestedBy: "BAGERca", videos: ["https://youtu.be/Ozknd5FBFE4"] },
        { title: "Choo-Choo Charles", description: "Поезд-паук убийца", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1766740/library_600x900_2x.jpg", suggestedBy: "BAGERca", videos: ["https://youtu.be/p1pnCCmc_OE"] },
        { title: "Despotism 3k", description: "ИИ захватил мир", image: "https://cdn2.steamgriddb.com/grid/29f4077e442da394330b94591c122cd3.jpg", suggestedBy: "BAGERca", videos: ["https://youtu.be/OT3QJZ_mrJo"] },
        { title: "Hyper Light Drifter", description: "Красивый пиксельный экшен", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/257850/library_600x900_2x.jpg", suggestedBy: "BAGERca", videos: ["https://youtu.be/nWufEJ1Ava0"] },
        { title: "Maneater", description: "Симулятор акулы-убийцы", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/629820/library_600x900_2x.jpg", suggestedBy: "BAGERca", videos: ["https://youtu.be/HCRmiOqUgYQ"] },
        { title: "Wall World", description: "Копаем стену", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2187290/library_600x900_2x.jpg", suggestedBy: "BAGERca", videos: ["https://youtu.be/0RTpkDFlfok"] }
    ],

    'suggestions-movies.json': [
        { title: "Interstellar / Интерстеллар", description: "...", images: ["https://images-s.kinorium.com/movie/poster/384511/w1500_51624343.jpg", "https://images-s.kinorium.com/movie/poster/384511/w1500_37519277.jpg", "https://images-s.kinorium.com/movie/poster/384511/w1500_3494978.jpg"], suggestedBy: "BAGERca" },
        { title: "Chainsaw Man / Человек-бензопила", description: "...", image: "https://images-s.kinorium.com/movie/poster/2679417/w1500_51122553.jpg", suggestedBy: "BAGERca" },
        { title: "Dandadan / Дандадан", description: "...", image: "https://images-s.kinorium.com/movie/poster/10775761/w1500_53717440.jpg", suggestedBy: "BAGERca" }
    ],

    'suggestions-youtube.json': [
        { description: "...", suggestedBy: "BAGERca", videos: ["https://youtu.be/Vi0flWHGVlg"] },
        { description: "...", suggestedBy: "BAGERca", videos: ["https://youtu.be/S0x2llxEAjk", "https://youtu.be/6nEfAb5q84o", "https://youtu.be/lnDP902qeqw", "https://youtu.be/yDA-A1jWswo"] },
        { description: "...", suggestedBy: "BAGERca", videos: ["https://youtu.be/MrNbqT7-S-Y", "https://youtu.be/7qa3erbXU80", "https://youtu.be/FbqsyItv9so", "https://youtu.be/4g_kbyPIjuo"] },
        { description: "...", suggestedBy: "BAGERca", videos: ["https://youtu.be/fEqjAznFQyk", "https://youtu.be/Of4BTo6GbjQ"] },
        { description: "...", suggestedBy: "BAGERca", videos: ["https://youtu.be/VuHT54rPJb4", "https://youtu.be/kVXxNb1vuxs", "https://youtu.be/SAzDZhSSa_c"] },
        { description: "...", suggestedBy: "BAGERca", videos: ["https://youtu.be/L79F2HRaD2g"] },
        { description: "...", suggestedBy: "BAGERca", videos: ["https://youtu.be/WI6GoJ8hfeE"] },
        { description: "...", suggestedBy: "BAGERca", videos: ["https://youtu.be/9Z2R4Ricqq8"] },
        { description: "...", suggestedBy: "BAGERca", videos: ["https://youtu.be/L7AHL98HCZM"] },
        { description: "...", suggestedBy: "BAGERca", videos: ["https://youtu.be/79vTeZzLmcY"] }
    ],

    'tierlist-static-games.json': {
        "metadata": { "generatedAt": "2026-08-04T19:42:52.687Z", "category": "games" },
        "tiers": [
            { id: "tier_S", name: "S", color: "#ff2d95", items: ["Alice: Madness Returns", "ABZÛ", "GRIS", "Winx Club"] },
            { id: "tier_A", name: "A", color: "#ff8c00", items: ["Borderlands 2", "State of Decay 2", "Dead Island 2", "The Bathhouse", "Cursed Digicam", "Jisatsu", "Silent Hill 2 Remake", "Portal", "Portal 2", "Bendy and the Ink Machine", "Bendy and the Dark Revival", "Minecraft", "Little Nightmares", "Little Nightmares II", "Little Nightmares III", "BioShock Infinite", "Outlast", "Supernatural: The Game", "Dome Keeper", "Vacation Cafe Simulator", "Sally Face", "Content Warning", "Tomodachi Life: Living the Dream", "Lethal Company", "R.E.P.O.", "Burglin' Gnomes", "Burger Shift Team Rush Prologue", "Buckshot Roulette", "Tiny Bunny", "The Inn-Sanity", "No, I'm Not a Human", "Layers of Fear", "It Takes Two", "The Boba Teashop", "Kiosk", "Resident Evil Revelations 2", "The Forest", "Untitled Goose Game", "Indika"] },
            { id: "tier_B", name: "B", color: "#ffd700", items: ["Parasocial", "For Sale", "Pine Harbor", "Unmourned", "Mouthwashing", "The Maid", "Subnautica", "Stick Fight: The Game", "The Cabin Factory", "The Floor Above", "Sons Of The Forest", "The Hole", "Who Am I?", "Bendy: Secrets of the Machine", "Bendy: Lone Wolf", "Boris and the Dark Survival", "Bad Cheese", "Banned Tapes", "Unturned", "Beholder", "Creepy Tale", "Creepy Tale 2", "Creepy Tale 3", "Creepy Tale Some Other Place", "Abyssus", "Counter-Strike 2", "Pit of Goblin", "S.T.A.L.K.E.R.: Shadow of Chernobyl", "Скуф на рыбалке", "Kholat", "Shinkansen 0", "Outlast 2", "Rv there yet", "MIMESIS", "Who's Your Daddy?", "Fuck You Witch", "Xenofeels"] },
            { id: "tier_C", name: "C", color: "#39ff14", items: ["Silent Hill f", "Hollow Knight", "Hollow Knight: Silksong", "Undertale", "SIGame", "Helltaker", "Machinika: Museum", "Cuphead", "VRChat", "SCP: Secret Laboratory"] },
            { id: "tier_D", name: "D", color: "#00ccff", items: ["Fused 240"] },
            { id: "tier_TRASH", name: "TRASH", color: "#555555", items: ["Poppy Playtime", "Valorant", "Fortnite", "War Thunder"] }
        ],
        "unassigned": ["Scorn", "SpiderHeck"]
    },

    'tierlist-static-movies.json': {
        "metadata": { "generatedAt": "2026-08-04T20:00:00.000Z", "category": "movies" },
        "tiers": [
            { id: "tier_S", name: "S", color: "#ff2d95", items: ["Shrek 2 / Шрек 2", "Shark Tale / Подводная братва"] },
            { id: "tier_A", name: "A", color: "#ff8c00", items: ["Garfield / Гарфилд", "Garfield: A Tail of Two Kitties / Гарфилд 2", "Arcane: Season 1 / Аркейн: 1 Сезон", "Arcane: Season 2 / Аркейн: 2 Сезон", "The Wild Robot / Дикий робот"] },
            { id: "tier_B", name: "B", color: "#ffd700", items: ["Gravity Falls / Гравити Фолз", "Indie Cross"] },
            { id: "tier_C", name: "C", color: "#39ff14", items: ["9 / Девять"] },
            { id: "tier_D", name: "D", color: "#00ccff", items: ["Heroes of Envell / Герои Энвелла"] },
            { id: "tier_TRASH", name: "TRASH", color: "#555555", items: [] }
        ],
        "unassigned": ["Spider-Man Noir / Паук-Нуар", "The LEGO Movie / ЛЕГО Фильм", "The LEGO Batman Movie / Лего Фильм: Бэтмен", "Ready Player One / Первому игроку приготовиться", "A Monster in Paris / Монстр в Париже"]
    }
};