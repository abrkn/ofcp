var ofcp = require('../lib/ofcp')
, expect = require('expect.js')

describe('ofcp', function() {
    describe('settle', function() {
        it('does not reward two points for winning two hands', function() {
            var hand1 = {
                // straight, +1
                back: ofcp.hand('7c 4d 8c 5d 6h'),
                // 8s, -1
                mid: ofcp.hand('3c 8h 8d 7s 2d'),
                // king, jack +1
                front: ofcp.hand('2h js kd')
            }
            , hand2 = {
                // trips, -1
                back: ofcp.hand('qs 9s qd qc 5c'),
                // 9s, +1
                mid: ofcp.hand('9d ah 9c 5h 6c'),
                // king 4, -1
                front: ofcp.hand('ks 3h 4c')
            }

            var settlement = ofcp.settle(hand1, hand2)
            expect(settlement).to.be(1)
        })

        it('gives point to the correct hand', function() {
            var hand1 = {
                // 55
                back: ofcp.hand('th jc 5c 5d 9c'),
                // kj
                mid: ofcp.hand('js 8h 7s ts kd'),
                // 7
                front: ofcp.hand('6s 2s 7c')
            }
            , hand2 = {
                // 44
                back: ofcp.hand('5s 4d 8s 4h td'),
                // a
                mid: ofcp.hand('2d ah 8c 4c 9h'),
                // q
                front: ofcp.hand('3c ks qs')
            }

            var settlement = ofcp.settle(hand1, hand2)
            expect(settlement).to.be(-1)
        })
    })

    describe('evalBackHand', function() {
        it('is consistent with poker-evaluator example 1', function() {
            var hand = ofcp.hand('As Ks Qs Js Ts')
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
            var hand = ofcp.hand('Ad Kd Qd Jd Td')
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
            var hand1 = ofcp.hand('6d 6h 6c Ks Ac')
            , hand2 =  ofcp.hand('7d 7h 7c Kd Ah')
            , rank1 = ofcp.evalBackHand(hand1)
            , rank2 = ofcp.evalBackHand(hand2)
            expect(rank1.handName).to.be('three of a kind')
            expect(rank1.handType).to.be(rank2.handType)
            expect(rank1.handRank).to.be.below(rank2.handRank)
        })
    })

    describe('evalMidHand', function() {
        it('is consistent with evalBackHand', function() {
            var hand = ofcp.hand('As Ks Qs Js Ts')
            , expected = ofcp.evalBackHand(hand)
            , actual = ofcp.evalMidHand(hand)
            expect(actual).to.eql(expected)
        })
    })

    describe('evalFrontHand', function() {
        it('throws if passed more than three cards', function() {
            expect(function() {
                ofcp.evalFrontHand(ofcp.hand('As Kh Ac 7d'))
            }).to.throwError(/cards/)
        })

        it('throws if passed less than three cards', function() {
            expect(function() {
                ofcp.evalFrontHand(ofcp.hand('As Kh Ac 7d'))
            }).to.throwError(/cards/)
        })

        it('throws if passed a null hand', function() {
            expect(function() {
                ofcp.evalFrontHand(null)
            }).to.throwError(/array/)
        })

        it('recognizes three of a kind', function() {
            var hand = ofcp.hand('4d 4s 4h')
            , expected = {
                handType: 4,
                handRank: 3,
                handName: 'three of a kind'
            }
            , actual = ofcp.evalFrontHand(hand)
            expect(actual).to.eql(expected)
        })

        it('recognizes pair', function() {
            var hand = ofcp.hand('4d 4s 2h')
            , rank = ofcp.evalFrontHand(hand)
            expect(rank.handName).to.be('one pair')
            expect(rank.handRank).to.be(13 * 3 + 1)
        })

        it('ranks high card with kickers', function() {
            var hand1 = ofcp.hand('As Ks Qs')
            , hand2 = ofcp.hand('Ad Kd Jd')
            , rank1 = ofcp.evalFrontHand(hand1)
            , rank2 = ofcp.evalFrontHand(hand2)
            expect(rank1.handName).to.be('high card')
            expect(rank1.handType).to.be(rank2.handType)
            expect(rank1.handRank).to.be.above(rank2.handRank)
        })
    })

    describe('isFoul', function() {
        it('it fouls if back is of lower rank than mid', function() {
            var back = ofcp.hand('Ks Kd 9d 3h 8h')
            , mid = ofcp.hand('As Ad Ac 7h 3d')
            , front = ofcp.hand('Qd Jh 8c')

            var actual = ofcp.isFoul(back, mid, front)
            expect(actual).to.be(true)
        })

        it('it does not foul when back is higher rank than mid', function() {
            var back = ofcp.hand('Ks Kd 9d 3h 8h')
            , mid = ofcp.hand('5s 5d Ac 7h 3d')
            , front = ofcp.hand('Qd Jh 8c')

            var actual = ofcp.isFoul(back, mid, front)
            expect(actual).to.be(false)
        })

        it('it is true for higher pair in front than mid', function() {
            var back = ofcp.hand('Ks Kd Kc 3h 8h')
            , mid = ofcp.hand('2s 2d Ac 7h 3d')
            , front = ofcp.hand('3d 3c 8c')

            var actual = ofcp.isFoul(back, mid, front)
            expect(actual).to.be(true)
        })

        it('it is false for lower pair in front than mid', function() {
            var back = ofcp.hand('Ks Kd Kc 3h 8h')
            , mid = ofcp.hand('5s 5d Ac 7h 3d')
            , front = ofcp.hand('3d 3c 8c')

            var actual = ofcp.isFoul(back, mid, front)
            expect(actual).to.be(false)
        })

        it('it is true for higher high card in front than mid', function() {
            var back = ofcp.hand('Ks Kd Kc 3h 8h')
            , mid = ofcp.hand('2s 6d Kh 7h 3d')
            , front = ofcp.hand('Ad 3c 8c')

            var actual = ofcp.isFoul(back, mid, front)
            expect(actual).to.be(true)
        })

        it('it is false for lower high card in front than mid', function() {
            var back = ofcp.hand('Ks Kd Kc 3h 8h')
            , mid = ofcp.hand('Qs 5d Tc 7h 3d')
            , front = ofcp.hand('Jd 3c 8c')

            var actual = ofcp.isFoul(back, mid, front)
            expect(actual).to.be(false)
        })

        it('it is true for lower three of a kind in front than mid', function() {
            var back = ofcp.hand('Ks Kd Kc 3h 8h')
            , mid = ofcp.hand('Ts Td Tc 7h 3d')
            , front = ofcp.hand('Qd Qc Qd')

            var actual = ofcp.isFoul(back, mid, front)
            expect(actual).to.be(true)
        })

        it('it is false for lower three of a kind in front than mid', function() {
            var back = ofcp.hand('Ks Kd Kc 3h 8h')
            , mid = ofcp.hand('Qs Qd Qc 7h 3d')
            , front = ofcp.hand('Td Tc Td')

            var actual = ofcp.isFoul(back, mid, front)
            expect(actual).to.be(false)
        })

        it('it is true for higher on pair in front than mid', function() {
            var back = ofcp.hand('Ks Kd Kc 3h 8h')
            , mid = ofcp.hand('2s 2c 8d 7h 3d')
            , front = ofcp.hand('2d 2h 9c')

            var actual = ofcp.isFoul(back, mid, front)
            expect(actual).to.be(true)
        })

        it('is true in problematic example', function() {
            var back = ofcp.hand('5d 4d 9d qs 5s') // pair of 5
            , mid = ofcp.hand('8h 4c kd th js') // king high
            , front = ofcp.hand('ks 7s ad') // ace high

            var actual = ofcp.isFoul(back, mid, front)
            expect(actual).to.be(true)
        })
    })

    describe('settleBack', function() {
        it('it gives one point for full house vs trips', function() {
            var back1 = ofcp.hand('7s 7d 7h 2d 2c')
            , back2 = ofcp.hand('As Ad Ah 2d 4c')
            , actual = ofcp.settleBack(back1, back2)
            expect(actual).to.be(1)
        })

        it('it gives minus one point for trips vs full house', function() {
            var back1 = ofcp.hand('As Ad Ah 2d 4c')
            , back2 = ofcp.hand('7s 7d 7h 2d 2c')
            , actual = ofcp.settleBack(back1, back2)
            expect(actual).to.be(-1)
        })

        it('it gives one point to the better full house', function() {
            var back1 = ofcp.hand('7s 7d 7h 2d 2c')
            , back2 = ofcp.hand('6d 6c 6h 4d 4c')
            , actual = ofcp.settleBack(back1, back2)
            expect(actual).to.be(1)
        })
    })

    describe('settleMid', function() {
        it('it gives one point for full house vs trips', function() {
            var mid1 = ofcp.hand('7s 7d 7h 2d 2c')
            , mid2 = ofcp.hand('As Ad Ah 2d 4c')
            , actual = ofcp.settleMid(mid1, mid2)
            expect(actual).to.be(1)
        })

        it('it gives minus one point for trips vs full house', function() {
            var mid1 = ofcp.hand('As Ad Ah 2d 4c')
            , mid2 = ofcp.hand('7s 7d 7h 2d 2c')
            , actual = ofcp.settleMid(mid1, mid2)
            expect(actual).to.be(-1)
        })

        it('it gives one point to the better full house', function() {
            var mid1 = ofcp.hand('7s 7d 7h 2d 2c')
            , mid2 = ofcp.hand('6d 6c 6h 4d 4c')
            , actual = ofcp.settleMid(mid1, mid2)
            expect(actual).to.be(1)
        })
    })

    describe('settleFront', function() {
        it('it pushes same pair and kicker', function() {
            var front1 = ofcp.hand('7s 7c Ah')
            , front2 = ofcp.hand('7h 7d Ac')
            , actual = ofcp.settleFront(front1, front2)
            expect(actual).to.be(0)
        })

        it('it gives one point to higher kicker', function() {
            var front1 = ofcp.hand('7s 7c Ah')
            , front2 = ofcp.hand('7h 7d Kc')
            , actual = ofcp.settleFront(front1, front2)
            expect(actual).to.be(1)
        })

        it('it gives minus one point to lower kicker', function() {
            var front1 = ofcp.hand('7s 7c Kh')
            , front2 = ofcp.hand('7h 7d Ac')
            , actual = ofcp.settleFront(front1, front2)
            expect(actual).to.be(-1)
        })

        it('does not push on problematic example', function() {
            var front1 = ofcp.hand('2h js kd')
            , front2 = ofcp.hand('ks 3h 4c')
            , actual = ofcp.settleFront(front1, front2)
            expect(actual).to.be(1)
        })
    })

    describe('settle', function() {
        it('pushes two foul hands', function() {
            var hand1 = {
                back: ofcp.hand('4s 4d 7h 9d Jc'),
                mid: ofcp.hand('5d 5h Ts 9h Ac'),
                front: ofcp.hand('Qh Ah 9c')
            }
            , hand2 = {
                back: ofcp.hand('4s 4d 7h 9d Jc'),
                mid: ofcp.hand('5d 5h Ts 9h Ac'),
                front: ofcp.hand('Qh Ah 9c')
            }
            , actual = ofcp.settle(hand1, hand2)
            expect(actual).to.be(0)
        })

        it('returns six when first hand scoops', function() {
            var hand1 = {
                back: ofcp.hand('4s 5s 6s 7s 8s'),
                mid: ofcp.hand('3d 5d Td Jd 4d'),
                front: ofcp.hand('Qh Qd Qs')
            }
            , hand2 = {
                back: ofcp.hand('4s 4d 7h 9d Jc'),
                mid: ofcp.hand('5d 5h Ts 9h Ac'),
                front: ofcp.hand('Qh Ah 9c')
            }
            , actual = ofcp.settle(hand1, hand2)
            expect(actual).to.be(6)
        })

        it('returns six when second hand scoops', function() {
            var hand1 = {
                back: ofcp.hand('As 8d 7h 9d Jc'),
                mid: ofcp.hand('5d 3h Ts 9h Ac'),
                front: ofcp.hand('3h 4h 9c')
            }
            , hand2 = {
                back: ofcp.hand('4s 5s 6s 7s 8s'),
                mid: ofcp.hand('Qd 5d Td Jd 4d'),
                front: ofcp.hand('Ah Qh Ks')
            }
            , actual = ofcp.settle(hand1, hand2)
            expect(actual).to.be(-6)
        })

        it('includes bonuses', function() {
            var hand1 = {
                back: ofcp.hand('As Ad 7h 9d Jc'),
                mid: ofcp.hand('5d Qh Qs 9h Ac'),
                front: ofcp.hand('6h 6h 9c')
            }
            , hand2 = {
                back: ofcp.hand('4s 5s 6s 7s 8s'),
                mid: ofcp.hand('Qd 5d Th Jd 4d'),
                front: ofcp.hand('Ah Qh Ks')
            }
            , actual = ofcp.settle(hand1, hand2, { front: true })
            // scoop + one point for pair of six
            expect(actual).to.be(7)
        })

        it('includes bonuse for mid', function() {
            var hand1 = {
                back: ofcp.hand('5h 6h 7h 8h Ah'),
                mid: ofcp.hand('5d Qd Td 9d 7d'),
                front: ofcp.hand('6h 6h 9c')
            }
            , hand2 = {
                back: ofcp.hand('4s 5s 6s 7s 8s'),
                mid: ofcp.hand('Qd 5d Th Jd 4d'),
                front: ofcp.hand('Ah Qh Ks')
            }
            , actual = ofcp.settle(hand1, hand2, { mid: [100, 200, 300, 400, 500, 600], scoop: 10 })
            // 3 for win, 10 for scoop, 200 for flush. 213
            expect(actual).to.be(213)
        })
    })

    describe('getBackBonus', function() {
        it('gives points for straight when rule is on', function() {
            var actual = ofcp.getBackBonus(
                ofcp.hand('5s 6d 7d 8c 9h'),
                { back: [2, 0, 0, 0, 0, 0] }
            )
            expect(actual).to.be(2)
        })

        it('gives points for royal flush when rule is on', function() {
            var actual = ofcp.getBackBonus(
                ofcp.hand('Ts Js Qs Ks As'),
                { back: [2, 4, 6, 10, 15, 30] }
            )
            expect(actual).to.be(30)
        })

        it('gives points for four of a kind when rule is on', function() {
            var actual = ofcp.getBackBonus(
                ofcp.hand('Ts Td Th Tc As'),
                { back: [2, 4, 6, 10, 15, 30] }
            )
            expect(actual).to.be(10)
        })

        it('gives points for royal flush when rule is on', function() {
            var actual = ofcp.getBackBonus(
                ofcp.hand('Td Jd Qd Kd Ad'),
                { back: [2, 4, 6, 10, 15, 30] }
            )
            expect(actual).to.be(30)
        })

        it('gives points for straight flush when rule is on', function() {
            var actual = ofcp.getBackBonus(
                ofcp.hand('9s Ts Js Qs Ks'),
                { back: [2, 4, 6, 10, 15, 30] }
            )
            expect(actual).to.be(15)
        })
    })

    describe('getFrontBonus', function() {
        it('gives points for pair of sixes when rule is on', function() {
            var actual = ofcp.getFrontBonus(
                ofcp.hand('6s 6d 5h'),
                { front: true }
            )
            expect(actual).to.be(1)
        })

        it('gives nine points for pair of aces when rule is on', function() {
            var actual = ofcp.getFrontBonus(
                ofcp.hand('As Ad 5h'),
                { front: true }
            )
            expect(actual).to.be(9)
        })

        it('gives ten points for trip twos when rule is on', function() {
            var actual = ofcp.getFrontBonus(
                ofcp.hand('2s 2d 2h'),
                { front: true }
            )
            expect(actual).to.be(10)
        })

        it('gives no points for pair of fives when rule is on', function() {
            var actual = ofcp.getFrontBonus(
                ofcp.hand('6s 5d 5h'),
                { front: true }
            )
            expect(actual).to.be(0)
        })
    })
})
