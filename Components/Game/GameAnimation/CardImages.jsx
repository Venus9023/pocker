
const cardImages = {
    '♠':[require('../../../assets/deckOfCards/PNG/♠2.png'),
    require('../../../assets/deckOfCards/PNG/♠3.png'),
    require('../../../assets/deckOfCards/PNG/♠4.png'),
    require('../../../assets/deckOfCards/PNG/♠5.png'),
    require('../../../assets/deckOfCards/PNG/♠6.png'),
    require('../../../assets/deckOfCards/PNG/♠7.png'),
    require('../../../assets/deckOfCards/PNG/♠8.png'),
    require('../../../assets/deckOfCards/PNG/♠9.png'),
    require('../../../assets/deckOfCards/PNG/♠10.png'),
    require('../../../assets/deckOfCards/PNG/♠J.png'),
    require('../../../assets/deckOfCards/PNG/♠Q.png'),
    require('../../../assets/deckOfCards/PNG/♠K.png'),
    require('../../../assets/deckOfCards/PNG/♠A.png')],

    '♣':[require('../../../assets/deckOfCards/PNG/♣2.png'),
    require('../../../assets/deckOfCards/PNG/♣3.png'),
    require('../../../assets/deckOfCards/PNG/♣4.png'),
    require('../../../assets/deckOfCards/PNG/♣5.png'),
    require('../../../assets/deckOfCards/PNG/♣6.png'),
    require('../../../assets/deckOfCards/PNG/♣7.png'),
    require('../../../assets/deckOfCards/PNG/♣8.png'),
    require('../../../assets/deckOfCards/PNG/♣9.png'),
    require('../../../assets/deckOfCards/PNG/♣10.png'),
    require('../../../assets/deckOfCards/PNG/♣J.png'),
    require('../../../assets/deckOfCards/PNG/♣Q.png'),
    require('../../../assets/deckOfCards/PNG/♣K.png'),
    require('../../../assets/deckOfCards/PNG/♣A.png')],

    '♥':[require('../../../assets/deckOfCards/PNG/♥2.png'),
    require('../../../assets/deckOfCards/PNG/♥3.png'),
    require('../../../assets/deckOfCards/PNG/♥4.png'),
    require('../../../assets/deckOfCards/PNG/♥5.png'),
    require('../../../assets/deckOfCards/PNG/♥6.png'),
    require('../../../assets/deckOfCards/PNG/♥7.png'),
    require('../../../assets/deckOfCards/PNG/♥8.png'),
    require('../../../assets/deckOfCards/PNG/♥9.png'),
    require('../../../assets/deckOfCards/PNG/♥10.png'),
    require('../../../assets/deckOfCards/PNG/♥J.png'),
    require('../../../assets/deckOfCards/PNG/♥Q.png'),
    require('../../../assets/deckOfCards/PNG/♥K.png'),
    require('../../../assets/deckOfCards/PNG/♥A.png')],

    '♦':[require('../../../assets/deckOfCards/PNG/♦2.png'),
    require('../../../assets/deckOfCards/PNG/♦3.png'),
    require('../../../assets/deckOfCards/PNG/♦4.png'),
    require('../../../assets/deckOfCards/PNG/♦5.png'),
    require('../../../assets/deckOfCards/PNG/♦6.png'),
    require('../../../assets/deckOfCards/PNG/♦7.png'),
    require('../../../assets/deckOfCards/PNG/♦8.png'),
    require('../../../assets/deckOfCards/PNG/♦9.png'),
    require('../../../assets/deckOfCards/PNG/♦10.png'),
    require('../../../assets/deckOfCards/PNG/♦J.png'),
    require('../../../assets/deckOfCards/PNG/♦Q.png'),
    require('../../../assets/deckOfCards/PNG/♦K.png'),
    require('../../../assets/deckOfCards/PNG/♦A.png')],

    'back': require('../../../assets/cardBack.png')
}

export function CardImageUtil(suit, value){
    var valueInt = 0

    if (value == "J") {
    valueInt = 11;
    }
    else if (value == "Q") {
    valueInt = 12;
    }
    else if (value == "K") {
    valueInt = 13;
    }
    else if (value == "A") {
    valueInt = 14;
    }
    else{
    valueInt = parseInt(value);
    }
    
    return cardImages[suit][valueInt-2]
}