from pathlib import Path
from math import atan2, cos, sin, pi
from html import escape
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).parent
OUT = ROOT / 'assets'
OUT.mkdir(exist_ok=True)
FONT = 'C:/Windows/Fonts/msyh.ttc'
BOLD = 'C:/Windows/Fonts/msyhbd.ttc'
INK = '#172033'
MUTED = '#475569'
ACCENT = '#2454b8'
SOFT = '#eef4ff'
LINE = '#7b8aa4'


class Figure:
    def __init__(self, width, height, title, description):
        self.w, self.h = width, height
        self.parts = [f'<title>{escape(title)}</title><desc>{escape(description)}</desc>',
                      f'<rect width="{width}" height="{height}" fill="#fff"/>']
        self.image = Image.new('RGB', (width * 2, height * 2), 'white')
        self.draw = ImageDraw.Draw(self.image)

    def text(self, x, y, value, size=26, color=INK, bold=False, anchor='middle'):
        font = ImageFont.truetype(BOLD if bold else FONT, size * 2)
        lines = value.split('\n')
        for i, line in enumerate(lines):
            yy = y + i * (size + 12)
            self.parts.append(f'<text x="{x}" y="{yy}" text-anchor="{anchor}" dominant-baseline="central" font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif" font-size="{size}" font-weight="{700 if bold else 400}" fill="{color}">{escape(line)}</text>')
            self.draw.text((x * 2, yy * 2), line, fill=color, font=font,
                           anchor='lm' if anchor == 'start' else 'mm')

    def node(self, x, y, w, h, title, sub='', active=False, title_size=28, sub_size=24):
        fill = SOFT if active else '#f6f7fa'
        self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="{fill}" stroke="#d1d9e6"/>')
        self.draw.rounded_rectangle((x * 2, y * 2, (x + w) * 2, (y + h) * 2), radius=24, fill=fill, outline='#d1d9e6', width=2)
        self.text(x + w / 2, y + (h / 2 if not sub else h * .30), title, title_size, bold=True)
        if sub:
            self.text(x + w / 2, y + h * .68, sub, sub_size, MUTED)

    def arrow(self, points, color=LINE, head=True):
        path = ' '.join(f'{x},{y}' for x, y in points)
        self.parts.append(f'<polyline points="{path}" fill="none" stroke="{color}" stroke-width="2.4" stroke-linejoin="round"/>')
        self.draw.line([(x * 2, y * 2) for x, y in points], fill=color, width=5, joint='curve')
        if not head:
            return
        x, y = points[-1]
        a, b = points[-2]
        theta = atan2(y - b, x - a)
        triangle = [(x, y), (x - 12 * cos(theta - pi / 6), y - 12 * sin(theta - pi / 6)),
                    (x - 12 * cos(theta + pi / 6), y - 12 * sin(theta + pi / 6))]
        self.parts.append('<polygon points="' + ' '.join(f'{a},{b}' for a, b in triangle) + f'" fill="{color}"/>')
        self.draw.polygon([(a * 2, b * 2) for a, b in triangle], fill=color)

    def save(self, name):
        data = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" role="img">' + ''.join(self.parts) + '</svg>'
        (OUT / (name + '.svg')).write_text(data, encoding='utf-8')
        self.image.save(OUT / (name + '.png'))


def loop(mobile=False):
    if mobile:
        f = Figure(360, 585, '目标与反馈循环', '内容吸引、获取培养、配队挑战与结果反馈形成循环。反馈促使玩家调整培养目标。')
        f.text(20, 28, '目标与反馈循环', 19, bold=True, anchor='start')
        names = [('内容与角色吸引', '剧情 · 演出 · 收集'), ('获取与培养', '角色 · 光锥 · 遗器'),
                 ('配队与挑战', '阵容 · 循环 · 关卡'), ('奖励与新目标', '结果反馈 · 后续需求')]
        for i, (title, sub) in enumerate(names):
            y = 62 + i * 117
            f.node(20, y, 304, 86, title, sub, i == 1, 19, 17)
            if i < 3:
                f.arrow([(172, y + 88), (172, y + 113)])
        f.arrow([(326, 456), (345, 456), (345, 222), (326, 222)], ACCENT)
        f.text(180, 540, '反馈推动调整与资源再投入', 17, ACCENT)
        f.save('01-loop-mobile')
        return
    f = Figure(1200, 370,
               '目标与反馈循环', '内容建立吸引，获取培养形成能力，配队挑战检验能力，奖励与新目标推动调整和再投入。')
    f.text(36, 35, '目标与反馈循环', 30, bold=True, anchor='start')
    names = [('内容与角色吸引', '剧情 · 演出 · 收集'), ('获取与培养', '角色 · 光锥 · 遗器'),
             ('配队与挑战', '阵容 · 循环 · 关卡'), ('奖励与新目标', '结果反馈 · 后续需求')]
    for i, (title, sub) in enumerate(names):
        x = 30 + i * 296
        f.node(x, 95, 250, 120, title, sub, i == 1)
        if i < 3:
            f.arrow([(x + 253, 155), (x + 289, 155)])
    f.arrow([(1043, 219), (1043, 285), (451, 285), (451, 219)], ACCENT)
    f.text(747, 324, '反馈推动调整与资源再投入', 26, ACCENT)
    f.save('01-loop')


def decisions(mobile=False):
    if mobile:
        f = Figure(360, 755, '共享资源产生团队取舍', '同样只有一点战技点，辅助普攻与辅助战技形成不同的机会成本；两条路径最终均剩一点。')
        f.text(20, 28, '相同起点，不同机会成本', 19, bold=True, anchor='start')
        paths = [('路径 A · 为主输出保留资源', [('初始 1 点', ''), ('辅助普攻 +1', '剩余 2 点'), ('主输出战技 −1', '最终剩余 1 点')]),
                 ('路径 B · 先取得辅助战技效果', [('初始 1 点', ''), ('辅助战技 −1', '剩余 0 点'), ('主输出普攻 +1', '最终剩余 1 点')])]
        for i, (label, nodes) in enumerate(paths):
            base = 65 + i * 321
            f.text(180, base, label, 17, ACCENT, True)
            for j, (title, sub) in enumerate(nodes):
                y = base + 24 + j * 91
                f.node(20, y, 320, 68, title, sub, j == 2, 19, 17)
                if j < 2:
                    f.arrow([(180, y + 70), (180, y + 88)])
        f.text(180, 704, '简化情境，不含角色的', 17, MUTED)
        f.text(180, 731, '特殊产耗点机制', 17, MUTED)
        f.save('02-decisions-mobile')
        return
    f = Figure(1200, 530,
               '共享资源产生团队取舍', '只有一点战技点时，辅助普攻可为主输出保留战技机会；辅助先用战技则会挤占此机会。两个示例最终都剩一点。')
    f.text(36, 35, '相同起点，不同机会成本', 30, bold=True, anchor='start')
    for i, (label, a, b, middle) in enumerate([
        ('路径 A · 为主输出保留资源', '辅助普攻 +1', '主输出战技 −1', '剩余 2 点'),
        ('路径 B · 先取得辅助战技效果', '辅助战技 −1', '主输出普攻 +1', '剩余 0 点')]):
        base = 105 + i * 185
        f.text(35, base - 25, label, 25, ACCENT, True, 'start')
        for x, title, sub, active in [(35, '初始 1 点', '', False), (427, a, middle, False), (819, b, '最终剩余 1 点', True)]:
            f.node(x, base, 335, 115, title, sub, active)
        f.arrow([(375, base + 57), (420, base + 57)])
        f.arrow([(767, base + 57), (812, base + 57)])
    f.text(35, 476, '简化情境，不含角色的特殊产耗点机制；路径优劣取决于当前目标。', 24, MUTED, anchor='start')
    f.save('02-decisions')


def relic(mobile=False):
    if mobile:
        f = Figure(360, 718, '遗器不确定性的两个阶段', '获取阶段可以通过定向合成缩小随机范围，强化阶段仍有分配的不确定性。')
        f.text(20, 28, '普通副本：不确定性在哪里？', 19, bold=True, anchor='start')
        names = [('套装与部位', '是否适合目标构筑'), ('主属性', '是否满足基础需求'),
                 ('副属性', '是否已有目标属性'), ('强化分配', '是否命中有效属性')]
        for i, (title, sub) in enumerate(names):
            y = 62 + i * 112
            f.node(20, y, 320, 84, title, sub, i == 3, 19, 17)
            if i < 3:
                f.arrow([(180, y + 86), (180, y + 109)])
        f.text(180, 525, '获取阶段 · 定向合成', 17, bold=True)
        f.text(180, 555, '缩小获取目标胚子的随机范围', 17, MUTED)
        f.text(180, 603, '强化阶段 · 分配仍有随机性', 17, ACCENT, True)
        f.text(180, 660, '“可用”标准随角色、队伍', 17, MUTED)
        f.text(180, 689, '与玩法目标变化', 17, MUTED)
        f.save('03-relic-mobile')
        return
    f = Figure(1200, 490,
               '遗器不确定性的两个阶段', '普通副本获取时，套装部位、主属性、副属性和强化分配逐层影响结果。定向合成可缩小获取阶段的不确定性，不能保证强化命中。')
    f.text(36, 35, '普通副本路径：不确定性在哪里？', 28, bold=True, anchor='start')
    names = [('套装与部位', '是否适合目标构筑'), ('主属性', '是否满足基础需求'),
             ('副属性', '是否已有目标属性'), ('强化分配', '是否命中有效属性')]
    for i, (title, sub) in enumerate(names):
        x = 30 + i * 296
        f.node(x, 108, 250, 120, title, sub, i == 3)
        if i < 3:
            f.arrow([(x + 253, 168), (x + 289, 168)])
    f.arrow([(42, 252), (42, 280), (857, 280), (857, 252)], head=False)
    f.text(450, 323, '获取阶段 · 定向合成可缩小随机范围', 26)
    f.text(1043, 287, '强化阶段', 26, ACCENT, True)
    f.text(1043, 330, '仍有不确定性', 24, ACCENT)
    f.text(600, 419, '“可用”标准随角色、队伍和玩法目标变化', 26, MUTED)
    f.save('03-relic')




for draw in (loop, decisions, relic):
    draw(False)
    draw(True)
print('Generated 6 editable SVGs and 6 PNGs.')
