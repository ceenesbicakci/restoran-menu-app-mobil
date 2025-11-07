(function(){
  const qs = new URLSearchParams(window.location.search);

  // Varsayılan: ceenesbicakci/restoran-menu-app-mobil repo'sundan menu.json
  const DEFAULT_RAW_URL = 'https://raw.githubusercontent.com/ceenesbicakci/restoran-menu-app-mobil/main/menu.json';

  // Kaynak belirleme önceliği: src -> default raw URL -> local
  function resolveSourceUrl() {
    const direct = qs.get('src');
    if (direct) return direct;

    // Varsayılan raw JSON URL (GitHub Pages'da çalışırken)
    if (window.location.hostname.includes('github.io') || window.location.hostname.includes('localhost')) {
      return DEFAULT_RAW_URL;
    }

    // Yerel demo (deploy öncesi):
    return 'menu.local.json';
  }

  function formatPrice(value, currency) {
    try {
      return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency || 'TRY', maximumFractionDigits: 2 }).format(value);
    } catch(_) {
      return `${value} ${currency || 'TRY'}`;
    }
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('JSON yüklenemedi: ' + res.status);
    return await res.json();
  }

  function setHeader(info, updatedAt) {
    const nameEl = document.getElementById('restaurant-name');
    const logoEl = document.getElementById('restaurant-logo');
    const tableEl = document.getElementById('table-indicator');
    const addressEl = document.getElementById('restaurant-address');
    const phoneEl = document.getElementById('restaurant-phone');

    nameEl.textContent = info?.name || 'Menü';
    if (info?.logo && info.logo.trim()) {
      logoEl.src = info.logo;
      logoEl.style.display = 'block';
      logoEl.onerror = function() { 
        this.style.display = 'none'; 
      }; // Hata durumunda gizle
    } else {
      logoEl.style.display = 'none';
    }
    const t = qs.get('t');
    tableEl.textContent = t ? `Masa: ${t}` : '';

    // Adres ve telefon
    if (info?.address && info.address.trim()) {
      addressEl.textContent = info.address;
      addressEl.style.display = 'block';
    } else {
      addressEl.style.display = 'none';
    }

    if (info?.phone && info.phone.trim()) {
      phoneEl.textContent = info.phone;
      phoneEl.style.display = 'block';
    } else {
      phoneEl.style.display = 'none';
    }
  }

  function render(menuData) {
    const categoriesEl = document.getElementById('categories');
    categoriesEl.innerHTML = '';

    const currency = menuData?.restaurant?.currency || 'TRY';
    const categories = Array.isArray(menuData?.categories) ? menuData.categories : [];
    if (!categories.length) {
      categoriesEl.innerHTML = '<div class="empty">Kategori bulunamadı.</div>';
      return;
    }

    for (const cat of categories) {
      const card = document.createElement('section');
      card.className = 'category-card';

      const title = document.createElement('h2');
      title.className = 'category-title';
      title.textContent = cat?.name || 'Kategori';
      card.appendChild(title);

      if (cat?.description) {
        const desc = document.createElement('div');
        desc.className = 'category-desc';
        desc.textContent = cat.description;
        card.appendChild(desc);
      }

      const items = Array.isArray(cat?.items) ? cat.items : [];
      for (const item of items) {
        const row = document.createElement('div');
        row.className = 'item';

        // Görsel varsa ekle
        if (item?.image && item.image.trim()) {
          const imgWrapper = document.createElement('div');
          imgWrapper.className = 'item-image-wrapper';
          const img = document.createElement('img');
          
          // Base64 data URL veya normal URL desteği
          const imageUrl = item.image.trim();
          if (imageUrl.startsWith('data:image')) {
            // Base64 görsel
            img.src = imageUrl;
          } else {
            // Normal URL
            img.src = imageUrl;
          }
          
          img.alt = item?.name || '';
          img.className = 'item-image';
          
          // Görsel yükleme kontrolü
          img.onerror = function() { 
            // Hata durumunda wrapper'ı gizle
            imgWrapper.style.display = 'none'; 
            console.warn('Görsel yüklenemedi:', imageUrl);
          };
          
          // Eğer görsel zaten yüklenmişse (cache'den)
          if (img.complete && img.naturalHeight !== 0) {
            imgWrapper.style.display = 'block';
          } else {
            img.onload = function() {
              // Yüklendiğinde görünür olduğundan emin ol
              imgWrapper.style.display = 'block';
            };
          }
          
          imgWrapper.appendChild(img);
          row.appendChild(imgWrapper);
        }

        const content = document.createElement('div');
        content.className = 'item-content';

        const name = document.createElement('div');
        name.className = 'item-name';
        name.textContent = item?.name || '';
        content.appendChild(name);

        const price = document.createElement('div');
        price.className = 'item-price';
        price.textContent = typeof item?.price === 'number' ? formatPrice(item.price, currency) : '';
        content.appendChild(price);

        if (item?.desc) {
          const desc = document.createElement('div');
          desc.className = 'item-desc';
          desc.textContent = item.desc;
          content.appendChild(desc);
        }

        if (Array.isArray(item?.tags) && item.tags.length) {
          const tags = document.createElement('div');
          tags.className = 'item-tags';
          for (const t of item.tags) {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = t;
            tags.appendChild(tag);
          }
          content.appendChild(tags);
        }

        row.appendChild(content);
        card.appendChild(row);
      }

      categoriesEl.appendChild(card);
    }
  }

  function applyThemeColors(colors) {
    if (!colors) {
      console.log('Renk ayarları bulunamadı');
      return;
    }
    console.log('Renkler uygulanıyor:', colors);
    const root = document.documentElement;
    const body = document.body;
    
    // CSS değişkenlerini güncelle
    if (colors.bgColor) {
      root.style.setProperty('--bg', colors.bgColor);
      body.style.backgroundColor = colors.bgColor;
    }
    if (colors.cardColor) root.style.setProperty('--card', colors.cardColor);
    if (colors.textColor) {
      root.style.setProperty('--text', colors.textColor);
      body.style.color = colors.textColor;
    }
    if (colors.mutedColor) root.style.setProperty('--muted', colors.mutedColor);
    if (colors.accentColor) root.style.setProperty('--accent', colors.accentColor);
    if (colors.borderColor) root.style.setProperty('--border', colors.borderColor);
    
    // Kategori renkleri
    if (colors.categoryTextColor) root.style.setProperty('--category-text', colors.categoryTextColor);
    
    console.log('Renkler uygulandı');
  }

  async function init() {
    const src = resolveSourceUrl();
    try {
      const data = await fetchJson(src);
      console.log('JSON yüklendi:', data);
      setHeader(data?.restaurant, data?.updatedAt);
      
      // Renkleri uygula (varsa)
      if (data?.themeColors) {
        console.log('Theme colors bulundu:', data.themeColors);
        applyThemeColors(data.themeColors);
      } else {
        console.log('Theme colors yok, varsayılan renkler kullanılıyor');
      }
      
      render(data);
    } catch (e) {
      setHeader({ name: 'Menü' }, null);
      const categoriesEl = document.getElementById('categories');
      categoriesEl.innerHTML = `<div class="empty">Veri yüklenemedi. Kaynak: ${src}</div>`;
      console.error('Hata:', e);
    }
  }

  window.MenuApp = { init };
})();


