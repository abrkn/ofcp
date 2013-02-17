var ofcp = require('../lib/ofcp')
, expect = require('expect.js')

describe('ofcp', function() {
    describe('evalBackHand', function() {
        it('is consistent with poker-evaluator example 1', function() {
            var hand = ['As', 'Ks', 'Qs', 'Js', 'Ts']
            , expected = {
                handType: 9,
                handRank: 10,
                handName: 'straight flush',
                value: 36874
            }
            , actual = ofcp.evalBackHand(hand)
            expect(actual).to.eql(expected)
        })

        it('is consistent with poker-evaluator example 2', function() {
            var hand = ['Ad', 'Kd', 'Qd', 'Jd', 'Td']
            , expected = {
                handType: 9,
                handRank: 10,
                handName: 'straight flush',
                value: 36874
            }
            , actual = ofcp.evalBackHand(hand)
            expect(actual).to.eql(expected)
        })

        it('prefers higher three of a kind', function() {
            var hand1 = ['6d', '6h', '6c', 'Ks', 'Ac']
            , hand2 =  ['7d', '7h', '7c', 'Kd', 'Ah']
            , rank1 = ofcp.evalBackHand(hand1)
            , rank2 = ofcp.evalBackHand(hand2)
            expect(rank1.handName).to.be('three of a kind')
            expect(rank1.handType).to.be(rank2.handType)
            expect(rank1.handRank).to.be.below(rank2.handRank)
        })
    })

    describe('evalMidHand', function() {
        it('is consistent with evalBackHand', function() {
            var hand = ['As', 'Ks', 'Qs', 'Js', 'Ts']
            , expected = ofcp.evalBackHand(hand)
            , actual = ofcp.evalMidHand(hand)
            expect(actual).to.eql(expected)
        })
    })

    describe('evalFrontHand', function() {
        it('throws if passed more than three cards', function() {
            expect(function() {
                ofcp.evalFrontHand(['As', 'Kh', 'Ac', '7d'])
            }).to.throwError(/cards/)
        })

        it('throws if passed less than three cards', function() {
            expect(function() {
                ofcp.evalFrontHand(['As', 'Kh', 'Ac', '7d'])
            }).to.throwError(/cards/)
        })

        it('throws if passed a null hand', function() {
            expect(function() {
                ofcp.evalFrontHand(null)
            }).to.throwError(/array/)
        })

        it('recognizes three of a kind', function() {
            var hand = ['4d', '4s', '4h']
            , expected = {
                handType: 4,
                handRank: 3,
                handName: 'three of a kind'
            }
            , actual = ofcp.evalFrontHand(hand)
            expect(actual).to.eql(expected)
        })

        it('recognizes pair', function() {
            var hand = ['4d', '4s', '2h']
            , rank = ofcp.evalFrontHand(hand)
            expect(rank.handName).to.be('one pair')
            expect(rank.handRank).to.be(13 * 3 + 1)
        })

        it('ranks high card with kickers', function() {
            var hand1 = ['As', 'Ks', 'Qs']
            , hand2 = ['Ad', 'Kd', 'Jd']
            , rank1 = ofcp.evalFrontHand(hand1)
            , rank2 = ofcp.evalFrontHand(hand2)
            expect(rank1.handName).to.be('high card')
            expect(rank1.handType).to.be(rank2.handType)
            expect(rank1.handRank).to.be.above(rank2.handRank)
        })
    })

    describe('isFoul', function() {
        it('it fouls if back is of lower rank than mid', function() {
            var back = ['Ks', 'Kd', '9d', '3h', '8h']
            , mid = ['As', 'Ad', 'Ac', '7h', '3d']
            , front = ['Qd', 'Jh', '8c']

            var actual = ofcp.isFoul(back, mid, front)
            expect(actual).to.be(true)
        })

        it('it does not foul when back is higher rank than mid', function() {
            var back = ['Ks', 'Kd', '9d', '3h', '8h']
            , mid = ['5s', '5d', 'Ac', '7h', '3d']
            , front = ['Qd', 'Jh', '8c']

            var actual = ofcp.isFoul(back, mid, front)
            expect(actual).to.be(false)
        })

        it('it is true for higher pair in front than mid', function() {
            var back = ['Ks', 'Kd', 'Kc', '3h', '8h']
            , mid = ['2s', '2d', 'Ac', '7h', '3d']
            , front = ['3d', '3c', '8c']

            var actual = ofcp.isFoul(back, mid, front)
            expect(actual).to.be(true)
        })

        it('it is false for lower pair in front than mid', function() {
            var back = ['Ks', 'Kd', 'Kc', '3h', '8h']
            , mid = ['5s', '5d', 'Ac', '7h', '3d']
            , front = ['3d', '3c', '8c']

            var actual = ofcp.isFoul(back, mid, front)
            expect(actual).to.be(false)
        })

        it('it is true for higher high card in front than mid', function() {
            var back = ['Ks', 'Kd', 'Kc', '3h', '8h']
            , mid = ['2s', '6d', 'Kh', '7h', '3d']
            , front = ['Ad', '3c', '8c']

            var actual = ofcp.isFoul(back, mid, front)
            expect(actual).to.be(true)
        })

        it('it is false for lower high card in front than mid', function() {
            var back = ['Ks', 'Kd', 'Kc', '3h', '8h']
            , mid = ['Qs', '5d', 'Tc', '7h', '3d']
            , front = ['Jd', '3c', '8c']

            var actual = ofcp.isFoul(back, mid, front)
            expect(actual).to.be(false)
        })

        it('it is true for lower three of a kind in front than mid', function() {
            var back = ['Ks', 'Kd', 'Kc', '3h', '8h']
            , mid = ['Ts', 'Td', 'Tc', '7h', '3d']
            , front = ['Qd', 'Qc', 'Qd']

            var actual = ofcp.isFoul(back, mid, front)
            expect(actual).to.be(true)
        })

        it('it is false for lower three of a kind in front than mid', function() {
            var back = ['Ks', 'Kd', 'Kc', '3h', '8h']
            , mid = ['Qs', 'Qd', 'Qc', '7h', '3d']
            , front = ['Td', 'Tc', 'Td']

            var actual = ofcp.isFoul(back, mid, front)
            expect(actual).to.be(false)
        })

        it('it is true for higher on pair in front than mid', function() {
            var back = ['Ks', 'Kd', 'Kc', '3h', '8h']
            , mid = ['2s', '2c', '8d', '7h', '3d']
            , front = ['2d', '2h', '9c']

            var actual = ofcp.isFoul(back, mid, front)
            expect(actual).to.be(true)
        })

        it('is true in problematic example', function() {
            var back = ['5d', '4d', '9d', 'qs', '5s'] // pair of 5
            , mid = ['8h', '4c', 'kd', 'th', 'js'] // king high
            , front = ['ks', '7s', 'ad'] // ace high

            var actual = ofcp.isFoul(back, mid, front)
            expect(actual).to.be(true)
        })
    })

    describe('settleBack', function() {
        it('it gives one point for full house vs trips', function() {
            var back1 = ['7s', '7d', '7h', '2d', '2c']
            , back2 = ['As', 'Ad', 'Ah', '2d', '4c']
            , actual = ofcp.settleBack(back1, back2)
            expect(actual).to.be(1)
        })

        it('it gives minus one point for trips vs full house', function() {
            var back1 = ['As', 'Ad', 'Ah', '2d', '4c']
            , back2 = ['7s', '7d', '7h', '2d', '2c']
            , actual = ofcp.settleBack(back1, back2)
            expect(actual).to.be(-1)
        })

        it('it gives one point to the better full house', function() {
            var back1 = ['7s', '7d', '7h', '2d', '2c']
            , back2 = ['6d', '6c', '6h', '4d', '4c']
            , actual = ofcp.settleBack(back1, back2)
            expect(actual).to.be(1)
        })
    })

    describe('settleMid', function() {
        it('it gives one point for full house vs trips', function() {
            var mid1 = ['7s', '7d', '7h', '2d', '2c']
            , mid2 = ['As', 'Ad', 'Ah', '2d', '4c']
            , actual = ofcp.settleMid(mid1, mid2)
            expect(actual).to.be(1)
        })

        it('it gives minus one point for trips vs full house', function() {
            var mid1 = ['As', 'Ad', 'Ah', '2d', '4c']
            , mid2 = ['7s', '7d', '7h', '2d', '2c']
            , actual = ofcp.settleMid(mid1, mid2)
            expect(actual).to.be(-1)
        })

        it('it gives one point to the better full house', function() {
            var mid1 = ['7s', '7d', '7h', '2d', '2c']
            , mid2 = ['6d', '6c', '6h', '4d', '4c']
            , actual = ofcp.settleMid(mid1, mid2)
            expect(actual).to.be(1)
        })
    })

    describe('settleFront', function() {
        it('it pushes same pair and kicker', function() {
            var front1 = ['7s', '7c', 'Ah']
            , front2 = ['7h', '7d', 'Ac']
            , actual = ofcp.settleFront(front1, front2)
            expect(actual).to.be(0)
        })

        it('it gives one point to higher kicker', function() {
            var front1 = ['7s', '7c', 'Ah']
            , front2 = ['7h', '7d', 'Kc']
            , actual = ofcp.settleFront(front1, front2)
            expect(actual).to.be(1)
        })

        it('it gives minus one point to lower kicker', function() {
            var front1 = ['7s', '7c', 'Kh']
            , front2 = ['7h', '7d', 'Ac']
            , actual = ofcp.settleFront(front1, front2)
            expect(actual).to.be(-1)
        })
    })

    describe('settle', function() {
        it('pushes two foul hands', function() {
            var hand1 = {
                back: ['4s', '4d', '7h', '9d', 'Jc'],
                mid: ['5d', '5h', 'Ts', '9h', 'Ac'],
                front: ['Qh', 'Ah', '9c']
            }
            , hand2 = {
                back: ['4s', '4d', '7h', '9d', 'Jc'],
                mid: ['5d', '5h', 'Ts', '9h', 'Ac'],
                front: ['Qh', 'Ah', '9c']
            }
            , actual = ofcp.settle(hand1, hand2)
            expect(actual).to.be(0)
        })

        it('returns six when first hand scoops', function() {
            var hand1 = {
                back: ['4s', '5s', '6s', '7s', '8s'],
                mid: ['3d', '5d', 'Td', 'Jd', '4d'],
                front: ['Qh', 'Qd', 'Qs']
            }
            , hand2 = {
                back: ['4s', '4d', '7h', '9d', 'Jc'],
                mid: ['5d', '5h', 'Ts', '9h', 'Ac'],
                front: ['Qh', 'Ah', '9c']
            }
            , actual = ofcp.settle(hand1, hand2)
            expect(actual).to.be(6)
        })

        it('returns six when second hand scoops', function() {
            var hand1 = {
                back: ['4s', '4d', '7h', '9d', 'Jc'],
                mid: ['5d', '5h', 'Ts', '9h', 'Ac'],
                front: ['Qh', 'Ah', '9c']
            }
            , hand2 = {
                back: ['4s', '5s', '6s', '7s', '8s'],
                mid: ['3d', '5d', 'Td', 'Jd', '4d'],
                front: ['Qh', 'Qd', 'Qs']
            }
            , actual = ofcp.settle(hand1, hand2)
            expect(actual).to.be(-6)
        })
    })
})