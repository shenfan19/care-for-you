/* 房屋：每种房子有自己的家具位置表。商店里买的东西不在代码里写位置，按这张表摆。
   items 的键是商品编号，值是这件东西在房子里的位置列表：s 精灵名，room 房间，x y 是房间里的格子坐标，rot 朝向（0 靠后墙面朝房里，1 靠左墙，2 和 3 反过来），
   lift 抬高的像素（放在桌面上），key 画的先后（负数先画，铺在地上）。以后换房子，新加一张表就行。 */
(function (CY) {
  CY.houses = {
    flat: {
      items: {
        toy: [{ s: 'bear', room: 'living', x: 2.9, y: 3.3 }],
        bed: [{ s: 'cabinetBedDrawer', room: 'bedroom', x: 3.8, y: 0.4 }, { s: 'lampRoundTable', room: 'bedroom', x: 3.8, y: 0.4, lift: 22, key: 4.3 }],
        stroller: [{ s: 'market-shopping-cart', room: 'living', x: 1.0, y: 3.6, rot: 1 }],
        wheelchair: [{ s: 'wheelchair', room: 'elder', x: 2.4, y: 3.2 }],
        decor1: [{ s: 'plantSmall2', room: 'living', x: 3.6, y: 3.5 }],
        decor2: [{ s: 'rugRectangle', room: 'living', x: 1.9, y: 2.0, rot: 1, key: -8 }, { s: 'lampSquareFloor', room: 'living', x: 0.3, y: 0.45 }],
        decor3: [{ s: 'radio', room: 'living', x: 0.3, y: 3.0, lift: 22, key: 3.31 }, { s: 'plantSmall3', room: 'living', x: 3.6, y: 2.9 }],
      },
    },
  };
  CY.house = () => CY.houses[(CY.game && CY.game.world && CY.game.world.house) || 'flat'] || CY.houses.flat;
})(globalThis.CY = globalThis.CY || {});
