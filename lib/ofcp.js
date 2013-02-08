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

        // high card
        if (midEval.handType === 1) {
            for (var i = 4; i >= 2; i--) {
                if (midRanks[i] < frontRanks[i - 2]) {
                    return true
                }

                if (midRanks[i] > frontRanks[i - 2]) {
                    return false
                }
            }

            return false
        }

        // one pair
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

            var frontKickers = frontRanks.filter(function(v) {
                return v !== frontPairRank
            })
            , midKickers = midRanks.filter(function(v) {
                return v !== midPairRank
            })

            if (midKickers[2] < frontKickers[0]) {
                return true
            }

            return false
        }

        // three of a kind
        if (midEval.handType === 4) {
            if (midRanks[0] > frontRanks[0]) {
                return false
            }

            if (midRanks[0] < frontRanks[0]) {
                return true
            }

            throw new Error('impossible duplicate three of a kind')
        }
    }
}