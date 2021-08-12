function login() {
  if (!document.getElementById('username-input').validity.valid && !document.getElementById('username-input-magic').validity.valid) {
    alert("The Username field is blank!");
  } else if (!document.getElementById('password-input').validity.valid && !document.getElementById('password-input-magic').validity.valid) {
    alert("The Password field is blank!");
  } else {
    if (document.body.querySelector('.login').style.display === 'block') {
      var username = document.getElementById('username-input-magic').value;
      var password = document.getElementById('password-input-magic').value;
      var chatId = localStorage.getItem('chat_id');
    } else {
      var username = document.getElementById('username-input').value;
      var password = document.getElementById('password-input').value;
      var chatId = ''
    }

    var data = {'username': username, 'password': password, 'chat_id': chatId}

    let chatHeaders = new Headers();
    chatHeaders.append('Accept', 'application/json');
    chatHeaders.append('Content-Type', 'application/json');
    const initLogin = {
      method: 'POST',
      headers: chatHeaders,
      body: JSON.stringify(data),
    };

    let request = fetch("/api/login", initLogin);

    request.then((response) => {
      if (response.status === 404) {
        alert("Invalid Username or Password.")
      } else if (response.status === 400) {
        return response.json().then((json) => {
          localStorage.setItem('userToken', json['session_token']);
          history.pushState({}, 'Chats', '/chats');
          alert("Sorry, the chat you are trying to join is full.");
          document.body.querySelector('.splash').style.display = 'none';
          document.body.querySelector('.chat-index').style.display = 'block';
          document.body.querySelector('.chat').style.display = 'none';
          document.body.querySelector('.login').style.display = 'none';
          startChatPolling();
        })
      } else {
        return response.json().then((json) => {
          localStorage.setItem('userToken', json.token);
          history.pushState({ "username": username }, 'Chats', '/chats');
          alert("Welcome " + username + ". You have successfully logged in!");
          document.body.querySelector('.splash').style.display = 'none';
          document.body.querySelector('.chat-index').style.display = 'block';
          document.body.querySelector('.login').style.display = 'none';
          startChatPolling();
        })
      }
    })
  }
}

function signup() {
  if (!document.getElementById('username-input').validity.valid && !document.getElementById('username-input-magic').validity.valid) {
    alert("The Username field is blank!");
  } else if (!document.getElementById('password-input').validity.valid && !document.getElementById('password-input-magic').validity.valid) {
    alert("The Password field is blank!");
  } else {
    if (document.body.querySelector('.login').style.display === 'block') {
      var username = document.getElementById('username-input-magic').value;
      var password = document.getElementById('password-input-magic').value;
      var chatId = localStorage.getItem('chat_id');
    } else {
      var username = document.getElementById('username-input').value;
      var password = document.getElementById('password-input').value;
      var chatId = '';
    }

    var data = {'username': username, 'password': password, 'chat_id': chatId}

    let chatHeaders = new Headers();
    chatHeaders.append('Accept', 'application/json');
    chatHeaders.append('Content-Type', 'application/json');
    const initSignup = {
      method: 'POST',
      headers: chatHeaders,
      body: JSON.stringify(data),
    };

    let request = fetch("/api/signup", initSignup);

    request.then((response) => {
      if (response.status === 403) {
        alert("Username has already been taken. Please choose a different one.")
      } else if (response.status === 400) {
        return response.json().then((json) => {
          localStorage.setItem('userToken', json['session_token']);
          history.pushState({}, 'Chats', '/chats');
          alert("Sorry, the chat you are trying to join is full.");
          document.body.querySelector('.splash').style.display = 'none';
          document.body.querySelector('.chat-index').style.display = 'block';
          document.body.querySelector('.chat').style.display = 'none';
          document.body.querySelector('.login').style.display = 'none';
          startChatPolling();
        })
      } else {
        return response.json().then((json) => {
          localStorage.setItem('userToken', json.token);
          history.pushState({ "userToken": json.token }, 'Chats', '/chats');
          alert("Welcome " + username + ". You have successfully signed up!");
          document.body.querySelector('.splash').style.display = 'none';
          document.body.querySelector('.chat-index').style.display = 'block';
          document.body.querySelector('.chat').style.display = 'block';
          document.body.querySelector('.login').style.display = 'none';
          startChatPolling();
        })
      }
    })
  }
}

function createChat() {
  var userToken = localStorage.getItem('userToken');
  var data = {"userToken": userToken};
  let chatHeaders = new Headers();
  chatHeaders.append('Accept', 'application/json');
  chatHeaders.append('Content-Type', 'application/json');
  const initCreateChat = {
    method: 'POST',
    headers: chatHeaders,
    body: JSON.stringify(data),
  };

  let request = fetch("/api/create", initCreateChat);

  request.then((response) => {
    return response.json()
  }).then((json) => {
    localStorage.setItem('chat_id' + json['chat_id'], json['chat_id']);
    history.pushState(
      { "userToken": userToken, "chat_id": json['chat_id'] },
      'Chat ' + json['chat_id'],
      '/chat/' + json['chat_id']
    );
    document.body.querySelector('.splash').style.display = 'none';
    document.body.querySelector('.chat-index').style.display = 'none';
    document.body.querySelector('.chat').style.display = 'block';
    document.body.querySelector('.login').style.display = 'none';
    var linkNode = document.body.querySelector('.magic-link');
    removeAllChildNodes(linkNode);
    var text = document.createTextNode(json['magic_invite_link']);
    linkNode.append(text);
    startMessagePolling();
  })
}

function postMessage() {
  var message = document.querySelector("#message").value;
  var pathArray = window.location.pathname.split('/');
  var pathChatId = pathArray[pathArray.length - 1];
  var chatId = localStorage.getItem('chat_id' + pathChatId);

  var data = {
    "session_token": localStorage.getItem('userToken'),
    "chat_id": chatId,
    "message": message,
  }

  let messageHeader = new Headers();
  messageHeader.append('Accept', 'application/json');
  messageHeader.append('Content-Type', 'application/json');
  const initPostMessage = {
    method: 'POST',
    headers: messageHeader,
    body: JSON.stringify(data),
  }

  let request = fetch("/api/messages", initPostMessage);

  request.then((response) => {
    if (response.status === 404) {
      history.pushState({}, 'Home', '/');
      document.body.querySelector('.splash').style.display = 'block';
      document.body.querySelector('.chat-index').style.display = 'none';
      document.body.querySelector('.chat').style.display = 'none';
      document.body.querySelector('.login').style.display = 'none';
      alert("Unable to send to this chat. Please Log in again.");
    } else {
      document.querySelector("#message").value = '';
      return response.json()
    }
  })
}

async function startChatPolling() {
  let activeChats = await getActiveChats();
  setTimeout(function() {
    startChatPolling();
  }, 1000)
  displayActiveChats(activeChats);
}

function getActiveChats() {
  var userToken = localStorage.getItem('userToken');
  let activeChatsHeader = new Headers();
  activeChatsHeader.append('Accept', 'application/json');
  activeChatsHeader.append('Content-Type', 'application/json');
  activeChatsHeader.append('Session-Token', userToken);
  const initRetrieveActiveChats = {
    method: 'GET',
    headers: activeChatsHeader,
  }

  let request = fetch("/api/active", initRetrieveActiveChats);

  let activeChats = request.then((response) => {
    return response.json()
  }).then((json) => {
    return json['numbers'];
  })

  return activeChats;
}

function displayActiveChats(activeChats) {
  var activeChatsNode = document.body.querySelector('.active-chats');
  removeAllChildNodes(activeChatsNode);
  for (let i = 0; i < activeChats.length; i++) {
    var oneChat = document.createElement('div');
    oneChat.setAttribute('class', 'active-chat-node');
    var body = document.createElement('p');
    body.setAttribute('class', 'body-node');
    body.addEventListener('click', function() {
      changeToChat(activeChats[i]['key'], activeChats[i]['magic_invite_link']);
    })
    var bodyText = document.createTextNode(activeChats[i]['key']);
    body.appendChild(bodyText);
    oneChat.appendChild(body);
    activeChatsNode.appendChild(oneChat);
    var hrNode = document.createElement('hr');
    activeChatsNode.appendChild(hrNode);
  }
}

function changeToChat(chatId, magicLink) {
  var localChatId = localStorage.getItem('chat_id' + chatId);
  history.pushState(
    { "chat_id": localChatId },
    'Chat ' + localChatId,
    '/chat/' + localChatId
  );

  document.body.querySelector('.splash').style.display = 'none';
  document.body.querySelector('.chat-index').style.display = 'none';
  document.body.querySelector('.chat').style.display = 'block';
  document.body.querySelector('.login').style.display = 'none';
  
  var linkNode = document.body.querySelector('.magic-link');
  removeAllChildNodes(linkNode);
  var text = document.createTextNode(magicLink);
  linkNode.append(text);
  startMessagePolling();
}

async function startMessagePolling() {
  let chats = await getMessages()
  setTimeout(function() {
    startMessagePolling()
  }, 500);
  if (chats !== ['TRANSITION']) {
    displayChats(chats);
  }
}


function getMessages() {
  let retrieveHeader = new Headers();
  retrieveHeader.append('Accept', 'application/json');
  retrieveHeader.append('Content-Type', 'application/json');
  var pathArray = window.location.pathname.split('/');
  var pathChatId = pathArray[pathArray.length - 1];
  if (pathChatId !== 'chats') {
    var chatId = localStorage.getItem('chat_id' + pathChatId);
    retrieveHeader.append('Session-Token', localStorage.getItem('userToken'));
    retrieveHeader.append('Chat-ID', chatId);
    const initRetrieveMessage = {
      method: 'GET',
      headers: retrieveHeader,
    }

    let request = fetch("/api/messages", initRetrieveMessage);

    let chats = request.then((response) => {
      if (response.status === 404) {
        history.pushState({}, 'Home', '/');
        document.body.querySelector('.splash').style.display = 'block';
        document.body.querySelector('.chat-index').style.display = 'none';
        document.body.querySelector('.chat').style.display = 'none';
        document.body.querySelector('.login').style.display = 'none';
        alert("Mhmm... How did you end up here? Log in again please.");
      } else {
        return response.json().then((json) => {
          return json['chats']
        })
      }
    })

    return chats;
  } else {
    return ['TRANSITION'];
  }
}


function displayChats(chats) {
  var messagesNode = document.body.querySelector('.messages');
  removeAllChildNodes(messagesNode);
  for (let i = 0; i < chats.length; i++) {
    var oneMessage = document.createElement('div');
    var username = document.createElement('p');
    var usernameText = document.createTextNode(chats[i]['username']);
    username.setAttribute('class', 'username-node')
    username.appendChild(usernameText);
    var body = document.createElement('p');
    body.setAttribute('class', 'body-node');
    var bodyText = document.createTextNode(chats[i]['body']);
    body.appendChild(bodyText);
    oneMessage.appendChild(username);
    oneMessage.appendChild(body);
    messagesNode.appendChild(oneMessage);
    var hrNode = document.createElement('hr');
    messagesNode.appendChild(hrNode);
  }
}







window.addEventListener("load", () => {
  handleState();
})

window.addEventListener("popstate", () => {
  handleState();
})



function handleState() {
  var pathname = document.location.pathname;
  var searchNameString = document.location.search;
  var searchNameArray = searchNameString.split('=');
  var searchname = searchNameArray[searchNameArray.length - 1];
  if (pathname === '/') {
    document.body.querySelector('.splash').style.display = 'block';
    document.body.querySelector('.chat-index').style.display = 'none';
    document.body.querySelector('.chat').style.display = 'none';
    document.body.querySelector('.login').style.display = 'none';
  } else if (pathname === '/login') {
    document.body.querySelector('.splash').style.display = 'block';
    document.body.querySelector('.chat-index').style.display = 'none';
    document.body.querySelector('.chat').style.display = 'none';
    document.body.querySelector('.login').style.display = 'none';
  } else if (pathname === '/chats') {
    document.body.querySelector('.splash').style.display = 'none';
    document.body.querySelector('.chat-index').style.display = 'block';
    document.body.querySelector('.chat').style.display = 'none';
    document.body.querySelector('.login').style.display = 'none';
    startChatPolling();
  } else if (pathname.startsWith('/chat/') && !searchNameString) {
    var userToken = localStorage.getItem('userToken');
    var pathArray = window.location.pathname.split('/');
    var pathChatId = pathArray[pathArray.length - 1];
    var dataMagic = {"userToken": userToken, "chatId": pathChatId};
    let authorizeHeaders = new Headers();
    authorizeHeaders.append('Accept', 'application/json');
    authorizeHeaders.append('Content-Type', 'application/json');
    const initAuthorizeChat = {
      method: 'POST',
      headers: authorizeHeaders,
      body: JSON.stringify(dataMagic),
    };

    let request = fetch("/api/authorize", initAuthorizeChat);

    request.then((response) => {
      if (response.status === 404) {
        history.pushState({}, 'Home', '/');
        document.body.querySelector('.splash').style.display = 'block';
        document.body.querySelector('.chat-index').style.display = 'none';
        document.body.querySelector('.chat').style.display = 'none';
        document.body.querySelector('.login').style.display = 'none';
        alert("Unable to access chat. Please Log in again.");
      } else {
        return response.json().then((json) => {
          document.body.querySelector('.splash').style.display = 'none';
          document.body.querySelector('.chat-index').style.display = 'none';
          document.body.querySelector('.chat').style.display = 'block';
          document.body.querySelector('.login').style.display = 'none';
          var linkNode = document.body.querySelector('.magic-link');
          removeAllChildNodes(linkNode);
          var text = document.createTextNode(json['magic_invite_link']);
          linkNode.append(text);
          startMessagePolling();
        })
      }
    })
  } else if (pathname.startsWith('/chat/') && searchNameString) {
    var userToken = localStorage.getItem('userToken');
    var pathArray = window.location.pathname.split('/');
    var pathChatId = pathArray[pathArray.length - 1];

    if (!pathChatId) {
      history.pushState({}, 'Home', '/');
      document.body.querySelector('.splash').style.display = 'block';
      document.body.querySelector('.chat-index').style.display = 'none';
      document.body.querySelector('.chat').style.display = 'none';
      document.body.querySelector('.login').style.display = 'none';
      alert("Invalid Chat. Please Log in again.");
    } else {
      localStorage.setItem('chat_id' + pathChatId, pathChatId);
      var dataMagicTwo = {
        'userToken': userToken,
        'magicKey': searchname,
        'chatId': pathChatId,
      };
      let magicHeaders = new Headers();
      magicHeaders.append('Accept', 'application/json');
      magicHeaders.append('Content-Type', 'application/json');
      const initMagicChat = {
        method: 'POST',
        headers: magicHeaders,
        body: JSON.stringify(dataMagicTwo),
      };
  
      let request = fetch("/api/join", initMagicChat);
  
      request.then((response) => {
        if (response.status === 404) {
          history.pushState({}, 'Home', '/');
          document.body.querySelector('.splash').style.display = 'block';
          document.body.querySelector('.chat-index').style.display = 'none';
          document.body.querySelector('.chat').style.display = 'none';
          document.body.querySelector('.login').style.display = 'none';
          alert("Unable to access chat. Invalid authorization. Please Log in again.");
        } else if (response.status === 202) {
          return response.json().then((json) => {
            localStorage.setItem('chat_id', json['chat_id']);
            history.pushState({}, 'Login', '/login');
            document.body.querySelector('.splash').style.display = 'none';
            document.body.querySelector('.chat-index').style.display = 'none';
            document.body.querySelector('.chat').style.display = 'none';
            document.body.querySelector('.login').style.display = 'block';
            var subtitleNode = document.body.querySelector('.centered-subtitle-login');
            removeAllChildNodes(subtitleNode)
            var h2Node = document.createElement('h2');
            var text = document.createTextNode('To Join Chat ' + json['chat_id']);
            h2Node.appendChild(text);
            subtitleNode.appendChild(h2Node);
            alert("Mhmm... We can't figure out who exactly you are. Please Login or Signup to join the chat!");
          })
        } else if (response.status === 400) {
          history.pushState({}, 'Chats', '/chats');
          alert("Sorry, the chat you are trying to join is full.");
          document.body.querySelector('.splash').style.display = 'none';
          document.body.querySelector('.chat-index').style.display = 'block';
          document.body.querySelector('.chat').style.display = 'none';
          document.body.querySelector('.login').style.display = 'none';
          startChatPolling();
        } else {
          return response.json().then((json) => {
            localStorage.setItem('chat_id' + json['chat_id'], json['chat_id']);
            history.pushState(
              { "userToken": userToken, "chat_id": json['chat_id'] },
              'Chat ' + json['chat_id'],
              '/chat/' + json['chat_id']
            );
            document.body.querySelector('.splash').style.display = 'none';
            document.body.querySelector('.chat-index').style.display = 'none';
            document.body.querySelector('.chat').style.display = 'block';
            document.body.querySelector('.login').style.display = 'none';
            var linkNode = document.body.querySelector('.magic-link');
            removeAllChildNodes(linkNode);
            var text = document.createTextNode(json['magic_invite_link']);
            linkNode.append(text);
            startMessagePolling();
          })
        }
      })
    }
  }
}



function removeAllChildNodes(parent) {
  while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
  }
}

