var PokerEvaluator = require('poker-evaluator')
, pe = new PokerEvaluator('./node_modules/poker-evaluator/HandRanks.dat')
, _ = require('underscore')

function sortNumericAsc(a, b) {
    return a - b
}

var ofcp = module.exports = {
    hand: function(hand) {
        var cards = hand.split(' ')
        return cards.map(function(c) {
            var result = PokerEvaluator.CARDS[c.toLowerCase()]
            if (!result) throw new Error('invald card ' + c)
            return result
        })
    },

    hands: function(back, mid, front) {
        return {
            back: this.hand(back),
            mid: this.hand(mid),
            front: this.hand(front)
        }
    },

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

        var ranks = hand.map(function(v) {
            return Math.floor((v - 1) / 4) + 1
        }).sort(sortNumericAsc)

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

        var midRanks = mid.map(function(v) {
            return Math.floor((v - 1) / 4) + 1
        }).sort(sortNumericAsc)
        , frontRanks = front.map(function(v) {
            return Math.floor((v - 1) / 4) + 1
        }).sort(sortNumericAsc)

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
            var midRank = midRanks[0] === midRanks[1] ?
                midRanks[0] :
                midRanks[1] === midRanks[2] ?
                midRanks[1] :
                midRanks[2]

            if (midRank > frontRanks[0]) {
                return false
            }

            if (midRank < frontRanks[0]) {
                return true
            }

            throw new Error('impossible duplicate three of a kind')
        }

        throw new Error('unexpected hand type ' + midEval.handType)
    },

    settleBack: function(back1, back2) {
        var back1Eval = ofcp.evalBackHand(back1)
        , back2Eval = ofcp.evalBackHand(back2)

        if (back1Eval.handType > back2Eval.handType) {
            return 1
        }

        if (back1Eval.handType < back2Eval.handType) {
            return -1
        }

        if (back1Eval.handRank > back2Eval.handRank) {
            return 1
        }

        if (back1Eval.handRank < back2Eval.handRank) {
            return -1
        }

        return 0
    },

    settleMid: function(mid1, mid2) {
        var mid1Eval = ofcp.evalMidHand(mid1)
        , mid2Eval = ofcp.evalMidHand(mid2)

        if (mid1Eval.handType > mid2Eval.handType) {
            return 1
        }

        if (mid1Eval.handType < mid2Eval.handType) {
            return -1
        }

        if (mid1Eval.handRank > mid2Eval.handRank) {
            return 1
        }

        if (mid1Eval.handRank < mid2Eval.handRank) {
            return -1
        }

        return 0
    },

    settleFront: function(front1, front2) {
        var front1Eval = ofcp.evalFrontHand(front1)
        , front2Eval = ofcp.evalFrontHand(front2)

        if (front1Eval.handType > front2Eval.handType) {
            return 1
        }

        if (front1Eval.handType < front2Eval.handType) {
            return -1
        }

        if (front1Eval.handRank > front2Eval.handRank) {
            return 1
        }

        if (front1Eval.handRank < front2Eval.handRank) {
            return -1
        }

        return 0
    },

    getBackBonus: function(hand, rules) {
        if (!rules || !rules.back) return 0
        if (rules.back.length !== 6) throw new Error('back rules must have 6 items')
        var handEval = this.evalBackHand(hand)

        if (handEval.handType === 9 && handEval.handRank === 10) {
            return rules.back[handEval.handType - 4]
        }

        // atleast straight
        return rules.back[handEval.handType - 5] || 0
    },

    getMidBonus: function(hand, rules) {
        if (!rules || !rules.mid) return 0
        if (rules.mid.length !== 6) throw new Error('mid rules must have 6 items')
        var handEval = this.evalMidHand(hand)

        if (handEval.handType === 9 && handEval.handRank === 10) {
            return rules.mid[handEval.handType - 4]
        }

        // atleast straight
        return rules.mid[handEval.handType - 5] || 0
    },

    getFrontBonus: function(hand, rules) {
        if (!rules || !rules.front) return 0

        var ranks = hand.map(function(v) {
            return Math.floor((v - 1) / 4) + 1
        }).sort(sortNumericAsc)

        // one pair
        if (ranks[0] === ranks[2]) {
            // ten points for 222
            return 9 + ranks[0]
        } else if (ranks[0] === ranks[1] || ranks[1] === ranks[2]) {
            // atleast pair of sixes
            return Math.max(0, ranks[1] - 4)
        }

        return 0
    },

    settle: function(hand1, hand2, rules) {
        var hand1Foul = this.isFoul(hand1.back, hand1.mid, hand1.front)
        , hand2Foul = this.isFoul(hand2.back, hand2.mid, hand2.front)
        , scoop = rules && _.isNumber(rules.scoop) ? rules.scoop : 3

        if (hand1Foul && hand2Foul) {
            return 0
        }

        var bonus = 0
        , back
        , mid
        , front

        if (!hand1Foul && hand2Foul) {
            back = 1 + this.getBackBonus(hand1.back, rules)
            mid = 1 + this.getMidBonus(hand1.mid, rules)
            front = 1 + this.getFrontBonus(hand1.front, rules)
            bonus += scoop
        } else if (hand1Foul & !hand2Foul) {
            back = -1 - this.getBackBonus(hand2.back, rules)
            mid = -1 - this.getMidBonus(hand2.mid, rules)
            front = -1 - this.getFrontBonus(hand2.front, rules)
            bonus += 3
        } else {
            back = this.settleBack(hand1.back, hand2.back)
            mid = this.settleMid(hand1.mid, hand2.mid)
            front = this.settleFront(hand1.front, hand2.front)

            // bous per hand
            if (back > 0) back += this.getBackBonus(hand1.back, rules)
            if (back < 0) back -= this.getBackBonus(hand2.back, rules)
            if (mid > 0) mid += this.getMidBonus(hand1.mid, rules)
            if (mid < 0) mid -= this.getMidBonus(hand2.mid, rules)
            if (front > 0) front += this.getFrontBonus(hand1.front, rules)
            if (front < 0) front -= this.getFrontBonus(hand2.front, rules)

            // scoop bonus
            if (back > 0 && mid > 0 && front > 0) bonus += scoop
            if (back < 0 && mid < 0 && front < 0) bonus -= scoop
        }

        return back + mid + front + bonus
    }
}
