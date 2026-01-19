document.getElementById('loginBtn').addEventListener('click', function() {
    clevertap.onUserLogin.push({
        "Site": {
            "Name": "City Fan",
            "Identity": "UNIQUE_USER_ID_123", 
            "Email": "WTH@example.com",
            "MSG-push": true,
        }
    });
    console.log("User identified to CleverTap");

    clevertap.event.push("User Logged In", {"Platform": "Web"});
});
document.getElementById('pushPromptBtn').addEventListener('click', function() {
clevertap.notifications.push({
   	"titleText": "Would you like to receive Push Notifications?",
   	"bodyText": "We promise to only send you relevant content and give you updates on your transactions",
   	"okButtonText": "Sign me up!",
   	"rejectButtonText": "No thanks",
   	"okButtonColor":"#F28046",
   	"askAgainTimeInSeconds":5,
  	"serviceWorkerPath": "/Users/rishabh.j/CTWEBAPP/clevertap_sw.js" 
  });
});

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', function() {
            const playerName = this.closest('.player-card').dataset.player;
            clevertap.event.push("Player Viewed", {
                "Player": playerName,
                "Platform": "Web"
            });
            alert(`Tracking view for ${playerName}!`);
        });
    });
});

const inboxBell = document.getElementById('inboxBell');
const inboxBadge = document.getElementById('inboxBadge');
const messageContainer = document.getElementById('inboxMessageContainer');
const markAllReadBtn = document.getElementById('markAllReadBtn');

function loadInboxMessages() {
    clevertap.getAllInboxMessages(function(err, messages) {
        if (err || !messages || messages.length === 0) {
            messageContainer.innerHTML = '<p class="no-messages">No messages yet.</p>';
            inboxBadge.style.display = 'none';
            return;
        }

        messageContainer.innerHTML = '';
        messages.forEach(function(msg) {
            const messageEl = document.createElement('div');
            messageEl.className = 'inbox-message';
            messageEl.dataset.msgId = msg.wzrk_id; 
            if (!msg.isRead) {
                clevertap.markReadInboxMessage(msg.wzrk_id);
            }

            messageEl.innerHTML = `
                <h4>${msg.title || 'No Title'}</h4>
                <p>${msg.message || ''}</p>
                <small>ID: ${msg.wzrk_id}</small>
            `;

            messageEl.addEventListener('click', function() {
                clevertap.renderNotificationClicked({
                    msgId: msg.wzrk_id,
                    wzrk_pivot: msg.wzrk_pivot || 'wzrk_default'
                });
                console.log('Clicked message:', msg.wzrk_id);
            });
            messageContainer.appendChild(messageEl);
        });

    });
}


inboxBell.addEventListener('click', function() {
    const isVisible = messageContainer.style.display === 'block';
    messageContainer.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
        loadInboxMessages(); 
    }
});

markAllReadBtn.addEventListener('click', function() {
    clevertap.markReadAllInboxMessage();
    alert('All messages marked as read.');
    
    loadInboxMessages();
});



document.addEventListener("CT_web_native_display", function(event) {
    console.log("Native Display Campaign Received:", event.detail);
    const data = event.detail;
    const bannerContainer = document.getElementById('native-display-banner');

    if (data.kv && data.kv.topic === "Welcome") {
        bannerContainer.innerHTML = `
            <div class="campaign-banner">
                <h4>Hello, ${data.kv.userName || 'Fan'}</h4>
                <p>${data.kv.message || 'Exclusive content inside.'}</p>
            </div>
        `;
        bannerContainer.style.display = 'block';
        clevertap.renderNotificationViewed(event.detail);
        bannerContainer.querySelector('.campaign-banner').addEventListener('click', function() {
            clevertap.renderNotificationClicked(event.detail);
        });
    }
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('clevertap_sw.js')
        .then(() => console.log('Service Worker registered for Push.'))
        .catch(err => console.error('Service Worker registration failed:', err));
}

clevertap.notificationCallback = function(notification) {
    console.log('CleverTap Pop-up Received:', notification);
    
    //Track notification was viewed
    clevertap.renderNotificationViewed({
        msgId: notification.msgId,
        pivotId: notification.pivotId || null
    });
    
    setTimeout(function() {
        var actionButton = document.getElementById('popup-action-btn');
        if (actionButton) {
            actionButton.addEventListener('click', function() {
                clevertap.renderNotificationClicked({
                    msgId: notification.msgId,
                    pivotId: notification.pivotId || null
                });
                console.log('Pop-up click tracked for msgId:', notification.msgId);
            });
        }
    }, 500)
    
};

document.getElementById('triggerBoxPopup').addEventListener('click', function() {
    clevertap.event.push("Pop-up Test Triggered", {"Type": "Box"});
    alert('A "Box" campaign will show if you have one active for the event "Pop-up Test Triggered" in your dashboard.');
});

document.getElementById('triggerBannerPopup').addEventListener('click', function() {
    clevertap.event.push("Pop-up Test Triggered", {"Type": "Banner"});
    alert('A "Banner" campaign will show if active.');
});

document.getElementById('triggerInterstitialPopup').addEventListener('click', function() {
    clevertap.event.push("Pop-up Test Triggered", {"Type": "Interstitial"});
    alert('An "Interstitial" campaign will show if active.');
});

document.getElementById('triggerExitIntent').addEventListener('click', function() {
    clevertap.event.push("Exit Intent Simulated");
    alert('Exit Intent simulated.');
});

console.log('Web Pop-up handlers initialized.');

document.addEventListener("CT_web_native_display", function(event) {
    console.log("[CleverTap] Native Display Event Received:", event.detail);

    const data = event.detail;
    const topic = data.kv.topic;
    switch (topic) {
        case "Cart drop-off":
            renderCartDropOffCampaign(data);
            break;
        default:
            console.warn("[CleverTap] Unknown campaign topic:", topic);
    }
});

function renderCartDropOffCampaign(data) {
    const userName = data.kv.Name;
    const productName = data.kv.Cart;

    const bannerEl = document.getElementById('cart-dropoff-banner');
    bannerEl.style.display = 'block';

    document.getElementById('user-name').textContent = userName;
    document.getElementById('product-name').textContent = productName;

    bannerEl.querySelector('.close').addEventListener('click', function() {
        bannerEl.style.display = 'none';
    });

    clevertap.renderNotificationViewed(data);

    bannerEl.addEventListener('click', function() {
        clevertap.renderNotificationClicked(data);
    });

    console.log(`[CleverTap] Rendered cart drop-off campaign for ${userName}`);
}
