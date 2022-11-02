import { defaultSignature } from './constants';

// Code to ignore alert when exiting page
// It's not working, need to find another way

// var script = document.createElement("script");
// script.type = "application/javascript";
// script.textContent = "(" + (function() {
// 	// disable window.onbeforeunload (DOM level 0)
//   // @ts-ignore
// 	delete Window.prototype.onbeforeunload;

// 	// disable window.addEventListener("beforeunload", ...) (DOM level 2)
// 	var addEventListener_ = EventTarget.prototype.addEventListener;
// 	EventTarget.prototype.addEventListener = function(type) {
// 		if (this != window || type != "beforeunload")
//       // @ts-ignore
// 			addEventListener_.apply(this, arguments);
// 	};
// }) + ")();";
// document.documentElement.appendChild(script);

const ELEMENT = {
  chatList: '[data-testid="chat-list"]',
  chatListRow: '[data-testid="chat-list"] [aria-selected][role="row"]',
  chatBoxInput: '[contenteditable="true"][data-testid="conversation-compose-box-input"]',
  chatLexicalText: '[contenteditable="true"][data-testid="conversation-compose-box-input"] [data-lexical-text="true"]',
};

const CAN_USE_DOM: boolean =
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined';

const IS_APPLE: boolean =
  CAN_USE_DOM && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

const EVENT_BUTTON_SEND_CHANGED = 'EVENT_BUTTON_SEND_CHANGED';
const EVENT_CHATBOX_INPUT_CHANGED = 'EVENT_CHATBOX_INPUT_CHANGED';

const elementApp = document.getElementById('app');
const appObserve = new MutationObserver((appMutations) => {
  for (const appMutation of appMutations) {
    if (appMutation.addedNodes.length) {
      // element conversation panel wrapper placed before drawer-right at 25/10/2022
      const drawerRight = document.querySelector('div[data-testid="drawer-right"]');
      if (drawerRight && drawerRight.previousSibling) {
        const mainContainerObserve = new MutationObserver((mainMutations) => {
          for (const mainMutation of mainMutations) {
            if (mainMutation.addedNodes.length) {
              const element = document.querySelector('#main[data-testid="conversation-panel-wrapper"]');
              if (element) {
                const cpw = new ConversionPanelWrapper(element as HTMLDivElement);
                cpw.writeSignature();
              }
            }
          }
        });

        mainContainerObserve.observe(drawerRight.previousSibling, { childList: true });
      }
    }
  }
});

if (elementApp) {
  appObserve.observe(elementApp, { childList: true });
}

let _ObserveList: {
  rightButtonWrapper: MutationObserver | null,
  chatBoxInput: MutationObserver | null,
} = { rightButtonWrapper: null, chatBoxInput: null };

class ConversionPanelWrapper {
  mainElement: HTMLDivElement;

  observe: {
    rightButtonWrapper: MutationObserver | null,
    chatBoxInput: MutationObserver | null,
  } = { rightButtonWrapper: null, chatBoxInput: null };

  eventListeners = {
    chatBoxSend: (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        this.writeSignature();
      }
    },
    sendMessageButtonClicked: () => {
      // wait for chat box input changed to write signature again
      this.mainElement.addEventListener(EVENT_CHATBOX_INPUT_CHANGED, ((event: CustomEvent) => {
        const mutations = event.detail.mutations as MutationRecord[];

        let added = 0;
        for (const mutation of mutations) {
          if (mutation.addedNodes.length) {
            added += mutation.addedNodes.length;
          }
        }

        if (added) {
          this.writeSignature();
        }
      }) as EventListener, { once: true });
    },
    sendMessageButtonShowed: (event: CustomEvent) => {
      const element = event.detail.target as HTMLButtonElement;

      // add event on send message button
      const testId = element.getAttribute('data-testid');
      if (testId === 'compose-btn-send') {
        // remove event before add new to prevent duplicate event listener
        element.removeEventListener('click', this.eventListeners.sendMessageButtonClicked);
        element.addEventListener(
          'click',
          this.eventListeners.sendMessageButtonClicked,
          false,
        );
      }
    },
  };

  constructor(element: HTMLDivElement) {
    this.mainElement = element;

    // flushing old observe
    ConversionPanelWrapper.flush();

    this.observeRightButtonWrapper();
    this.observeChatBoxInput();
  }

  static flush(): void {
    if (_ObserveList.rightButtonWrapper) {
      _ObserveList.rightButtonWrapper.disconnect();
      _ObserveList.rightButtonWrapper = null;
    }

    if (_ObserveList.chatBoxInput) {
      _ObserveList.chatBoxInput.disconnect();
      _ObserveList.chatBoxInput = null;
    }
  }

  protected registerEvents() {
    this.mainElement.addEventListener(
      EVENT_BUTTON_SEND_CHANGED,
      this.eventListeners.sendMessageButtonShowed as EventListener
    );

    const chatBoxInputElement = this.chatBoxInputElement();
    if (chatBoxInputElement) {
      // remove old event before add new event to prevent duplicate event listener
      chatBoxInputElement.removeEventListener('keydown', this.eventListeners.chatBoxSend);
      chatBoxInputElement.addEventListener('keydown', this.eventListeners.chatBoxSend);
    }
  }

  protected writeChatBox(callback: () => void) {
    const element = this.chatBoxInputElement();
    if (!element) return;

    if (!chrome?.storage) {
      console.log('Cannot access chrome storage while writing chat');
      return;
    }

    chrome.storage.local.get('signature', (data) => {
      const signature = 'signature' in data ? data.signature : defaultSignature;
      writeChat(element, signature, () => {
        callback();
      });
    });
  }

  /**
   * Watch on right button wrapper changed via MutationObserver
   *
   * @param callback
   */
  protected observeRightButtonWrapper(): MutationObserver | null {
    const element = this.rightButtonWrapperElement();
    if (element) {
      const observe = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          // trigger when have available new nodes
          if (mutation.addedNodes.length) {
            const element = mutation.addedNodes[0] as HTMLElement;
            // fire event on button send changed
            this.mainElement.dispatchEvent(new CustomEvent(EVENT_BUTTON_SEND_CHANGED, {
              detail: { target: element },
            }));
          }
        }
      });

      observe.observe(element, { childList: true });
      _ObserveList.rightButtonWrapper = observe;
      return observe;
    }

    return null;
  }

  protected observeChatBoxInput(): MutationObserver | null {
    const element = this.chatBoxInputElement();
    if (element) {
      const observe = new MutationObserver((mutations) => {
        this.mainElement.dispatchEvent(new CustomEvent(EVENT_CHATBOX_INPUT_CHANGED, {
          detail: { target: element, mutations },
        }));
      });

      observe.observe(element, { childList: true });
      _ObserveList.chatBoxInput = observe;
      return observe;
    }

    return null;
  }

  public writeSignature() {
    this.registerEvents();

    if (!this.chatBoxInputValue()) {
      this.writeChatBox(() => {
        this.moveCursorToFirstCharacter();
       });
    } else {
      this.moveCursorToFirstCharacter();
    }
  }

  /**
   * Make sure cursor wal already focused inside chat box input
   */
  protected moveCursorToFirstCharacter(): void {
    const element = this.chatBoxInputElement();
    if (element) {
      // move cursor to first character
      setTimeout(() => {
        setCursor(element, 0, 0);

        // TODO: find better way to trigger event
        // window.onbeforeunload = null;
        // window.onbeforeunload = () => {
        //   return null;
        // };
      }, 0);
    } else {
      console.log('ChatBox element doest not exits while moving cursor to first character');
    }
  }

  /**
   * Get right button wrapper element
   *
   * @returns Return wrapper of send voice button and send message button
   */
  rightButtonWrapperElement(): HTMLElement | null {
    const voiceButtonElement = this.mainElement.querySelector('button[data-testid="ptt-ready-btn"]');
    const msgButtonElement = this.mainElement.querySelector('button[data-testid="compose-btn-send"]');

    let parent: HTMLElement | null = null;
    if (voiceButtonElement) {
      parent = voiceButtonElement.parentElement;
    } else if (msgButtonElement) {
      parent = msgButtonElement.parentElement;
    }

    return parent;
  }

  chatBoxInputValue(): string {
    let text = '';
    const element: HTMLDivElement | null = this.mainElement.querySelector(ELEMENT.chatBoxInput);
    if (element) {
      element.childNodes.forEach((node, index) => {
        text += node.textContent;
        if (index + 1 < element.childElementCount) {
          text += '\n';
        }
      });
    }
    return text;
  }

  chatBoxInputElement(): HTMLDivElement | null {
    return this.mainElement.querySelector(ELEMENT.chatBoxInput);
  }
}

// helpers

function writeChat(element: HTMLDivElement, text: string, callback: () => void) {
  const list = text.split(/\r?\n/);

  const insertText = () => {
    element.focus();

    // get fist text and remove from list
    const lineText = list.shift();

    // trigger new element with inserting text
    document.execCommand('insertText', false, lineText);

    // add paragraph if have new line
    if (list.length) {
      insertParagraph(element);
    }
  };

  const onMutation: MutationCallback = (mutations, observer) => {
    insertText();

    if (!list.length) {
      observer.disconnect();
      callback();
    }
  };

  const observe = new MutationObserver(onMutation);
  observe.observe(element, { childList: true });

  insertText();
}

function setCursor(element: Element, line: number, offset: number) {
  const range = document.createRange();
  const selection = window.getSelection();

  if (element.childNodes) {
    const focus = element.childNodes[line] as HTMLParagraphElement | null;
    if (!focus) {
      console.log('Cannot focusing child element, element doest not exits');
      return;
    }

    range.selectNode(focus);
    range.setStart(focus, offset);
    range.collapse(true);

    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}

function insertParagraph(element: Element) {
  // https://github.com/facebook/lexical/blob/ba1274f9eea709a6f9b48c52e63ca93bdd2e1cd5/packages/lexical/src/LexicalUtils.ts#L968
  element.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Enter',
    keyCode: 13,
    shiftKey: true,
    cancelable: true,
    bubbles: true
  }));
}

function deleteParagraph(element: Element) {
  const eventName = 'keydown';
  const initKeydown: KeyboardEventInit = {
      key: 'Delete',
      code: 'Delete',
      keyCode: 46, // delete
      ctrlKey: true,
      metaKey: false,
      cancelable: true,
      bubbles: true
  };

  if (IS_APPLE) {
    // initKeydown.keyCode = 72;
  }

  element.dispatchEvent(new KeyboardEvent(eventName, initKeydown));
}
