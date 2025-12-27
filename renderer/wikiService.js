// Configuration for different game wikis
export const WIKIS = {
    minecraft: {
        name: 'Minecraft',
        api: 'https://minecraft.fandom.com/api.php',
        icon: '⛏️'
    },
    terraria: {
        name: 'Terraria',
        api: 'https://terraria.fandom.com/api.php',
        icon: '🗡️'
    },
    stardew: {
        name: 'Stardew Valley',
        api: 'https://stardewvalleywiki.com/mediawiki/api.php',
        icon: '🌾'
    },
    zelda: {
        name: 'Zelda (Tears of Kingdom)',
        api: 'https://zelda.fandom.com/api.php',
        icon: '🗡️'
    },
    eldenring: {
        name: 'Elden Ring',
        api: 'https://eldenring.fandom.com/api.php',
        icon: '💍'
    },
    darksouls: {
        name: 'Dark Souls',
        api: 'https://darksouls.fandom.com/api.php',
        icon: '🔥'
    }
};

let currentWiki = 'minecraft';

export function setCurrentWiki(wikiKey) {
    if (WIKIS[wikiKey]) {
        currentWiki = wikiKey;
    }
}

export function getCurrentWiki() {
    return WIKIS[currentWiki];
}

// Function to search wiki articles
export async function searchWiki(query) {
    const api = WIKIS[currentWiki].api;
    const url = `${api}?action=opensearch&search=${encodeURIComponent(query)}&limit=10&format=json&origin=*`;
    console.log(url);

    const response = await fetch(url);
    const data = await response.json();
    console.log(data);

    return data;
}

// Function to fetch page content as rendered HTML with chunked loading support
export async function fetchPage(title) {
    const api = WIKIS[currentWiki].api;
    const url = `${api}?action=parse&page=${encodeURIComponent(title)}&format=json&formatversion=2&prop=text|sections&origin=*`;

    const response = await fetch(url);
    const data = await response.json();

    console.log(data);

    if (data.error) {
        throw new Error(data.error.info || 'Failed to fetch page');
    }

    return {
        html: data.parse.text,
        sections: data.parse.sections || []
    };
}

// Function to fetch page images
export async function fetchPageImages(title) {
    const api = WIKIS[currentWiki].api;
    const url = `${api}?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=300&format=json&formatversion=2&origin=*`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.query && data.query.pages && data.query.pages[0]) {
            return data.query.pages[0].thumbnail?.source || null;
        }
    } catch (error) {
        console.error('Error fetching images:', error);
    }
    
    return null;
}
