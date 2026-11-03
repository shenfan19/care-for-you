/* 房屋：每种房子有自己的家具位置表。商店里买的东西不在代码里写位置，按这张表摆。
   items 的键是商品编号，值是这件东西在房子里的位置列表：s 精灵名，room 房间，x y 是房间里的格子坐标，rot 朝向（0 靠后墙面朝房里，1 靠左墙，2 和 3 反过来），
   lift 抬高的像素（放在桌面上），key 画的先后（负数先画，铺在地上）。以后换房子，新加一张表就行。 */
(function (CY) {
  /* w 是家的格子宽度，vw 和 vh 是画面大小，rooms 是比基础户型多出来的房间，bedCap 是每间房的床位上限 */
  CY.houses = {
    flat: {
      w: 12, vw: 800, vh: 520, rooms: {}, bedCap: { bedroom: 3, elder: 2 },
      items: {
        toy: [{ s: 'bear', room: 'living', x: 2.9, y: 3.3 }],
        bed: [{ s: 'cabinetBedDrawer', room: 'bedroom', x: 3.9, y: 1.0 }, { s: 'lampRoundTable', room: 'bedroom', x: 3.9, y: 1.0, lift: 22, key: 4.9 }],
        bed2: [{ s: 'lampSquareFloor', room: 'elder', x: 3.6, y: 0.5 }],
        books: [{ s: 'bookcaseOpen', room: 'living', x: 2.6, y: 0.4 }],
        fruit: [{ s: 'food-apple', room: 'kitchen', x: 2.4, y: 2.55, lift: 32, key: 4.7 }, { s: 'food-bread', room: 'kitchen', x: 1.65, y: 2.3, lift: 32, key: 4.6 }],
        cabinet: [{ s: 'bookcaseClosedWide', room: 'living', x: 1.7, y: 0.4 }],
        stroller: [{ s: 'market-shopping-cart', room: 'living', x: 1.0, y: 3.6, rot: 1 }],
        wheelchair: [{ s: 'wheelchair', room: 'elder', x: 2.4, y: 3.2 }],
        decor1: [{ s: 'plantSmall2', room: 'living', x: 3.6, y: 3.5 }],
        decor2: [{ s: 'rugRectangle', room: 'living', x: 1.9, y: 2.0, rot: 1, key: -8 }, { s: 'lampSquareFloor', room: 'living', x: 0.3, y: 0.45 }],
        decor3: [{ s: 'radio', room: 'living', x: 0.3, y: 3.0, lift: 22, key: 3.31 }, { s: 'plantSmall3', room: 'living', x: 3.6, y: 2.9 }],
      },
    },
  };
  CY.houses.house2 = { w: 16, vw: 900, vh: 600, rooms: { guest: { gx: 12, gy: 0, w: 4, h: 8 } }, bedCap: { bedroom: 3, elder: 2, guest: 3 }, items: CY.houses.flat.items };
  /* 买了中等屋子就住进去，没买住小户型 */
  CY.houseId = () => (CY.game && CY.game.world && CY.game.world.owned && CY.game.world.owned.house2 ? 'house2' : 'flat');
  CY.house = () => CY.houses[CY.houseId()];
})(globalThis.CY = globalThis.CY || {});
