var PokerEvaluator = require('poker-evaluator')
, pe = new PokerEvaluator('./node_modules/poker-evaluator/HandRanks.dat')
, _ = require('underscore')
, ofcp = module.exports = {
    evalBackHand: function(hand) {
        if (!_.isArray(hand)) {
            throw new Error('hand not an array')
        }

        if (hand.length !== 5) {
            throw new Error('hand must have five cards')
        }

        var result = pe.evalHand(hand)

        if (result.handType === 0) {
            throw new Error('invalid hand')
        }

        return result
    },

    evalMidHand: function(hand) {
        return ofcp.evalBackHand(hand)
    },

    evalFrontHand: function(hand) {
        if (!_.isArray(hand)) {
            throw new Error('hand not an array')
        }

        if (hand.length !== 3) {
            throw new Error('hand must have three cards')
        }

        var values = hand.map(function(c) {
            return PokerEvaluator.CARDS[c.toLowerCase()]
        })
        , ranks = values.map(function(v) {
            return Math.floor((v - 1) / 4) + 1
        }).sort()

        // three of a kind
        if (ranks[0] === ranks[2]) {
            return {
                handType: 4,
                handName: 'three of a kind',
                handRank: ranks[0]
            }
        }

        // one pair
        if (ranks[0] === ranks[1] || ranks[1] === ranks[2]) {
            return {
                handType: 2,
                handName: 'one pair',
                handRank: ranks[1] * 13 + (ranks[0] === ranks[1] ? ranks[2] : ranks[0])
            }
        }

        // high card
        return {
            handType: 1,
            handName: 'high card',
            handRank: ranks[2] * 13 * 13 + ranks[1] * 13 + ranks[0]
        }
    },

    isFoul: function(back, mid, front) {
        var backEval = this.evalBackHand(back)
        , midEval = this.evalMidHand(mid)
        , frontEval = this.evalFrontHand(front)

        if (backEval.handType < midEval.handType) {
            return true
        }

        if (backEval.handType === midEval.handType &&
            backEval.handRank <= midEval.handRank) {
            return true
        }

        if (midEval.handType < frontEval.handType) {
            return true
        }

        if (midEval.handType > frontEval.handType) {
            return false
        }

        var midValues = mid.map(function(c) {
            return PokerEvaluator.CARDS[c.toLowerCase()]
        })
        , frontValues = front.map(function(c) {
            return PokerEvaluator.CARDS[c.toLowerCase()]
        })
        , midRanks = midValues.map(function(v) {
            return Math.floor((v - 1) / 4) + 1
        }).sort()
        , frontRanks = frontValues.map(function(v) {
            return Math.floor((v - 1) / 4) + 1
        }).sort()

        if (midEval.handType === 1) {
            for (var i = 4; i >= 2; i--) {
                if (midRanks[i] < frontRanks[i - 2]) {
                    return true
                }

                if (midRanks[i] > frontRanks[i - 2]) {
                    return false
                }
            }

            // what's the rule here?
            return true
        }

        if (midEval.handType === 2) {
            var frontPairRank = frontRanks[0] === frontRanks[1] ?
                frontRanks[0] :
                frontRanks[1]
            , midPairRank = midRanks[0] === midRanks[1] ?
                midRanks[0] : midRanks[1] === midRanks[2] ?
                midRanks[1] : midRanks[2] === midRanks[3] ?
                midRanks[2] : midRanks[3]

            if (midPairRank !== frontPairRank) {
                return midPairRank < frontPairRank
            }

            console.error('same pair in mid/front ' + midPairRank)

            throw new Error('TODO: kicker comparison for mid vs front')
        }

        throw new Error('TODO: hand types for mid vs front')
    }
}