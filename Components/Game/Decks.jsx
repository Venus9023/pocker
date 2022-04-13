
const SUITS = ['♣','♦','♥','♠']
const VALUE = ['2','3','4','5','6','7','8','9', '10', 'J', 'Q', 'K', 'A']
const CARDIMG = []

export default class Deck {
    get numberOfCards() {
       return this.cards.length
    }

    shuffle(){
        this.cards = freshDeck()
        for(let i = this.numberOfCards -1; i > 0; i--) {
            const newIndex = Math.floor(Math.random() * (i+1))
            const oldIndex = this.cards[newIndex]
            this.cards[newIndex] = this.cards[i]
            this.cards[i] = oldIndex
        }
    }

}

 class Cards {
    constructor(suit, value, image ){
        this.suit = suit
        this.value = value
        this.image = image
    }
}


function freshDeck() {
    return VALUE.flatMap(value => {
        return SUITS.map(suit => {
            return new Cards(suit, value,
               ('../../../assets/deckOfCards/PNG/' + suit + value + '.png'))
        });
        
    });
        
        
}

