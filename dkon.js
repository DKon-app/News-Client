 let currentGroupId = null;
    let currentItemId = 0;
    let myGroups = [];
    let myGroupsNextId = 0;
    let isMyFeedOpen = false;
    let lastFeedItemId = 0;
    let newPostsCount = 0;
    let feedChecker = null;
    let isLoadingGroups = false;

    async function loadMyGroups(initial = true) {
      if (isLoadingGroups) return;
      isLoadingGroups = true;

      const res = await window.dkonAPI.getMyGroups(myGroupsNextId);
      if (res.error || !res.items) {
        document.getElementById('groups-list').innerHTML += '<div style="padding:20px; color:#8b949e; text-align:center;">There are no more communities</div>';
        isLoadingGroups = false;
        return;
      }

      myGroups = myGroups.concat(res.items);
      myGroupsNextId = res.itemId || 0;

      if (initial) {
        renderGroups(myGroups);
      } else {
        document.getElementById('groups-list').innerHTML += res.items.map(g => groupHTML(g)).join('');
      }

      isLoadingGroups = false;
    }

    function loadMoreGroupsIfNeeded() {
      const el = document.getElementById('groups-list');
      if (el.scrollHeight - el.scrollTop < el.clientHeight + 300 && myGroupsNextId !== 0) {
        loadMyGroups(false);
      }
    }

    function groupHTML(g) {
      return `
        <div class="group-item ${currentGroupId == g.id ? 'active' : ''}" onclick="openGroup(${g.id}, '${escapeHtml(g.fullname)}', ${g.follow})">
          <img src="${g.lowPhotoUrl || 'https://res.dkon.app/img/profile_default_photo.png'}" 
               onerror="this.src='https://res.dkon.app/img/profile_default_photo.png'">
          <div class="group-info">
            <div class="group-name">${escapeHtml(g.fullname)}</div>
            <div class="group-desc">${g.followersCount} subscribers • ${g.postsCount} posts</div>
          </div>
        </div>`;
    }

    function renderGroups(groups) {
      document.getElementById('groups-list').innerHTML = groups.map(groupHTML).join('');
    }

    async function openGroup(groupId, groupName, isFollowed) {
      currentGroupId = groupId;
      currentItemId = 0;
      isMyFeedOpen = false;
      document.getElementById('main-content').innerHTML = `
        <div class="chat-header">
          ${escapeHtml(groupName)}
          <button class="follow-btn ${isFollowed ? 'following' : ''}" id="follow-btn" onclick="toggleFollow(${groupId}, this)">
            ${isFollowed ? 'Unsubscribe' : 'Subscribe'}
          </button>
        </div>
        <div class="posts-container" id="posts-container">
          <div class="loading">Loading...</div>
        </div>
      `;
      highlightActive();

      const res = await window.dkonAPI.getGroupWall(groupId, 0);
      if (!res.error && res.items) {
        currentItemId = res.itemId || 0;
        renderPosts(res.items);
      }
    }

    async function toggleFollow(groupId, btn) {
      const res = await window.dkonAPI.followGroup(groupId);
      if (res.error) return alert('Ошибка');

      const newStatus = res.follow;
      btn.textContent = newStatus ? 'Unsubscribe' : 'Subscribe';
      btn.classList.toggle('following', newStatus);

      const groupInList = myGroups.find(g => g.id == groupId);
      if (groupInList) {
        groupInList.follow = newStatus;
        groupInList.followersCount = res.followersCount;
        renderGroups(myGroups);
      }
      highlightActive();
    }

    async function openMyFeed() {
      isMyFeedOpen = true;
      newPostsCount = 0;
      updateBadge();
      currentItemId = lastFeedItemId;
      
      document.getElementById('main-content').innerHTML = `
        <div class="chat-header">My Feed</div>
        <div class="posts-container" id="posts-container">
          <div class="loading">Loading...</div>
        </div>
      `;
      highlightActive();

      const res = await window.dkonAPI.getFeed(0);
      if (!res.error && res.items) {
        lastFeedItemId = res.itemId || 0;
        currentItemId = lastFeedItemId;
        renderPosts(res.items);
      }
    }

    function renderPosts(posts) {
      if (!posts || posts.length === 0) {
        document.getElementById('posts-container').innerHTML = '<div style="text-align:center; padding:60px; color:#8b949e;">There are no posts</div>';
        return;
      }
      document.getElementById('posts-container').innerHTML = posts.map(p => {
        const avatar = p.fromUserPhoto || p.owner?.lowPhotoUrl || 'https://res.dkon.app/img/profile_default_photo.png';
        const name = p.fromUserFullname || p.owner?.fullname || 'Unknown';
        const username = p.fromUserUsername || p.owner?.username || '';
        const media = p.imgUrl ? `<img src="${p.imgUrl}">` :
                     p.videoUrl ? `<video controls poster="${p.previewVideoImgUrl || ''}"><source src="${p.videoUrl}"></video>` : '';

        return `
          <div class="post">
            <div class="post-header">
              <img class="post-avatar" src="${avatar}" onerror="this.src='https://res.dkon.app/img/profile_default_photo.png'">
              <div>
                <div class="post-name">${name}</div>
                <div class="post-username">@${username} • ${p.timeAgo || 'Recently'}</div>
              </div>
            </div>
            <div class="post-text">${p.post || ''}</div>
            <div class="post-media">${media}</div>
            <div class="post-footer">❤️ ${p.likesCount || 0} • 💬 ${p.commentsCount || 0}</div>
          </div>`;
      }).join('');
    }

    function highlightActive() {
      document.querySelectorAll('.group-item').forEach(el => el.classList.remove('active'));
      document.getElementById('my-feed-btn').style.background = isMyFeedOpen ? 'var(--active)' : 'var(--hover)';
      if (currentGroupId) {
        const activeItem = document.querySelector(`.group-item[onclick*="${currentGroupId}"]`);
        if (activeItem) activeItem.classList.add('active');
      }
    }

    async function checkNewPosts() {
      if (isMyFeedOpen) return;
      const res = await window.dkonAPI.getFeed(0);
      if (res.error || !res.itemId) return;
      if (lastFeedItemId === 0) {
        lastFeedItemId = res.itemId || 0;
        return;
      }
      if (res.itemId !== lastFeedItemId) {
        newPostsCount++;
        updateBadge();
        if (!document.hasFocus()) {
          new Notification("DKon.app", { body: `+${newPostsCount} new posts`, icon: "https://res.dkon.app/dkon-icon/new-november-2025-icon/favicon.ico" });
        }
      }
    }

    function updateBadge() {
      const badge = document.getElementById('new-posts-badge');
      if (newPostsCount > 0) {
        badge.textContent = newPostsCount > 99 ? '99+' : newPostsCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }

    let searchTimeout;
    const debouncedSearch = (q) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if (!q.trim()) renderGroups(myGroups);
        else performSearch(q.trim());
      }, 300); //400
    };

    async function performSearch(query) {
      const res = await window.dkonAPI.searchGroups(query, 0);
      if (res?.items) renderGroups(res.items);
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    document.addEventListener('scroll', async (e) => {
      if (!e.target.closest('#posts-container')) return;
      const el = e.target.closest('#posts-container');
      if (el.scrollHeight - el.scrollTop < el.clientHeight + 800) {
        let res;
        if (isMyFeedOpen) {
          res = await window.dkonAPI.getFeed(currentItemId);
        } else if (currentGroupId) {
          res = await window.dkonAPI.getGroupWall(currentGroupId, currentItemId);
        } else return;

        if (res?.items?.length) {
          currentItemId = res.itemId || 0;
          el.innerHTML += res.items.map(p => renderPostHTML(p)).join('');
        }
      }
    }, true);
          
           function renderPostHTML(p) {
      const avatar = p.fromUserPhoto || p.owner?.lowPhotoUrl || 'https://res.dkon.app/img/profile_default_photo.png';
      const name = p.fromUserFullname || p.owner?.fullname || 'Unknown';
      const username = p.fromUserUsername || p.owner?.username || '';
      const media = p.imgUrl ? `<img src="${p.imgUrl}">` :
                   p.videoUrl ? `<video controls poster="${p.previewVideoImgUrl || ''}"><source src="${p.videoUrl}"></video>` : '';
      return `<div class="post"><div class="post-header"><img class="post-avatar" src="${avatar}" onerror="this.src='https://res.dkon.app/img/profile_default_photo.png'"><div><div class="post-name">${name}</div><div class="post-username">@${username} • ${p.timeAgo || 'Recently'}</div></div></div><div class="post-text">${p.post || ''}</div><div class="post-media">${media}</div><div class="post-footer">❤️ ${p.likesCount || 0} • 💬 ${p.commentsCount || 0}</div></div>`;
    }

    loadMyGroups();
    feedChecker = setInterval(checkNewPosts, 15000); //3000
    checkNewPosts();
    if (Notification.permission === "default") Notification.requestPermission();