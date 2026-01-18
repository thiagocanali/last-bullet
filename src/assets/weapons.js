export const weapons = {
  pistol: {
    name: "Pistol",
    fireRate: 400,
    damage: 1,
    recoil: { x: 4, y: -10 },
    maxAmmo: 12,
    reloadTime: 1200,
    spreadMax: 15
  },
  rifle: {
    name: "Assault Rifle",
    fireRate: 110,
    damage: 1,
    recoil: { x: 8, y: -15 },
    maxAmmo: 30,
    reloadTime: 2000,
    spreadMax: 40
  },
  sniper: {
    name: "Heavy Sniper",
    fireRate: 1500,
    damage: 10,
    recoil: { x: 0, y: -60 },
    maxAmmo: 5,
    reloadTime: 3500,
    spreadMax: 5
  }
};