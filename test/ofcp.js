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
    })
})