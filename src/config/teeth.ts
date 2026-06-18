import type { Tooth, ShadeGuide } from '../types'

export const PermanentTeeth: Tooth[] = [
  { number: '18', name: '右上第三磨牙', quadrant: 'upper-right', isPrimary: false },
  { number: '17', name: '右上第二磨牙', quadrant: 'upper-right', isPrimary: false },
  { number: '16', name: '右上第一磨牙', quadrant: 'upper-right', isPrimary: false },
  { number: '15', name: '右上第二前磨牙', quadrant: 'upper-right', isPrimary: false },
  { number: '14', name: '右上第一前磨牙', quadrant: 'upper-right', isPrimary: false },
  { number: '13', name: '右上尖牙', quadrant: 'upper-right', isPrimary: false },
  { number: '12', name: '右上侧切牙', quadrant: 'upper-right', isPrimary: false },
  { number: '11', name: '右上中切牙', quadrant: 'upper-right', isPrimary: false },

  { number: '21', name: '左上中切牙', quadrant: 'upper-left', isPrimary: false },
  { number: '22', name: '左上侧切牙', quadrant: 'upper-left', isPrimary: false },
  { number: '23', name: '左上尖牙', quadrant: 'upper-left', isPrimary: false },
  { number: '24', name: '左上第一前磨牙', quadrant: 'upper-left', isPrimary: false },
  { number: '25', name: '左上第二前磨牙', quadrant: 'upper-left', isPrimary: false },
  { number: '26', name: '左上第一磨牙', quadrant: 'upper-left', isPrimary: false },
  { number: '27', name: '左上第二磨牙', quadrant: 'upper-left', isPrimary: false },
  { number: '28', name: '左上第三磨牙', quadrant: 'upper-left', isPrimary: false },

  { number: '38', name: '左下第三磨牙', quadrant: 'lower-left', isPrimary: false },
  { number: '37', name: '左下第二磨牙', quadrant: 'lower-left', isPrimary: false },
  { number: '36', name: '左下第一磨牙', quadrant: 'lower-left', isPrimary: false },
  { number: '35', name: '左下第二前磨牙', quadrant: 'lower-left', isPrimary: false },
  { number: '34', name: '左下第一前磨牙', quadrant: 'lower-left', isPrimary: false },
  { number: '33', name: '左下尖牙', quadrant: 'lower-left', isPrimary: false },
  { number: '32', name: '左下侧切牙', quadrant: 'lower-left', isPrimary: false },
  { number: '31', name: '左下中切牙', quadrant: 'lower-left', isPrimary: false },

  { number: '41', name: '右下中切牙', quadrant: 'lower-right', isPrimary: false },
  { number: '42', name: '右下侧切牙', quadrant: 'lower-right', isPrimary: false },
  { number: '43', name: '右下尖牙', quadrant: 'lower-right', isPrimary: false },
  { number: '44', name: '右下第一前磨牙', quadrant: 'lower-right', isPrimary: false },
  { number: '45', name: '右下第二前磨牙', quadrant: 'lower-right', isPrimary: false },
  { number: '46', name: '右下第一磨牙', quadrant: 'lower-right', isPrimary: false },
  { number: '47', name: '右下第二磨牙', quadrant: 'lower-right', isPrimary: false },
  { number: '48', name: '右下第三磨牙', quadrant: 'lower-right', isPrimary: false },
]

export const PrimaryTeeth: Tooth[] = [
  { number: '55', name: '右上第二乳磨牙', quadrant: 'upper-right', isPrimary: true },
  { number: '54', name: '右上第一乳磨牙', quadrant: 'upper-right', isPrimary: true },
  { number: '53', name: '右上乳尖牙', quadrant: 'upper-right', isPrimary: true },
  { number: '52', name: '右上乳侧切牙', quadrant: 'upper-right', isPrimary: true },
  { number: '51', name: '右上乳中切牙', quadrant: 'upper-right', isPrimary: true },

  { number: '61', name: '左上乳中切牙', quadrant: 'upper-left', isPrimary: true },
  { number: '62', name: '左上乳侧切牙', quadrant: 'upper-left', isPrimary: true },
  { number: '63', name: '左上乳尖牙', quadrant: 'upper-left', isPrimary: true },
  { number: '64', name: '左上第一乳磨牙', quadrant: 'upper-left', isPrimary: true },
  { number: '65', name: '左上第二乳磨牙', quadrant: 'upper-left', isPrimary: true },

  { number: '85', name: '左下第二乳磨牙', quadrant: 'lower-left', isPrimary: true },
  { number: '84', name: '左下第一乳磨牙', quadrant: 'lower-left', isPrimary: true },
  { number: '83', name: '左下乳尖牙', quadrant: 'lower-left', isPrimary: true },
  { number: '82', name: '左下乳侧切牙', quadrant: 'lower-left', isPrimary: true },
  { number: '81', name: '左下乳中切牙', quadrant: 'lower-left', isPrimary: true },

  { number: '71', name: '右下乳中切牙', quadrant: 'lower-right', isPrimary: true },
  { number: '72', name: '右下乳侧切牙', quadrant: 'lower-right', isPrimary: true },
  { number: '73', name: '右下乳尖牙', quadrant: 'lower-right', isPrimary: true },
  { number: '74', name: '右下第一乳磨牙', quadrant: 'lower-right', isPrimary: true },
  { number: '75', name: '右下第二乳磨牙', quadrant: 'lower-right', isPrimary: true },
]

export const AllTeeth: Tooth[] = [...PermanentTeeth, ...PrimaryTeeth]

export const ShadeGuides: ShadeGuide[] = [
  'A1', 'A2', 'A3', 'A3.5', 'A4',
  'B1', 'B2', 'B3', 'B4',
  'C1', 'C2', 'C3', 'C4',
  'D2', 'D3', 'D4',
]

export function getToothByNumber(number: string): Tooth | undefined {
  return AllTeeth.find((t) => t.number === number)
}

export function getTeethByQuadrant(quadrant: Tooth['quadrant'], primary: boolean = false): Tooth[] {
  return (primary ? PrimaryTeeth : PermanentTeeth).filter((t) => t.quadrant === quadrant)
}
