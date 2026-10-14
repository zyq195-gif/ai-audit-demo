"""Generate public, entirely fictional PDF fixtures for the demo preview.

These files intentionally contain no copied pages, drawings, seals, project
identifiers, measurements, or metadata from the private source reports.
Run with a Python environment that has reportlab installed.
"""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "demo-pdfs"
BLUE = colors.HexColor("#245FD3")
INK = colors.HexColor("#243248")
MUTED = colors.HexColor("#64748B")
LINE = colors.HexColor("#DCE6F4")
PALE = colors.HexColor("#F3F7FF")


def register_font():
    candidates = [
        Path("C:/Windows/Fonts/simhei.ttf"),
        Path("/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc"),
        Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"),
        Path("/System/Library/Fonts/PingFang.ttc"),
    ]
    for candidate in candidates:
        if candidate.exists():
            pdfmetrics.registerFont(TTFont("DemoChinese", str(candidate)))
            return "DemoChinese"
    raise RuntimeError("A Chinese font is required to generate the demo PDFs.")


FONT = register_font()
STYLE = {
    "title": ParagraphStyle("title", fontName=FONT, fontSize=21, leading=30, textColor=INK, spaceAfter=9),
    "subtitle": ParagraphStyle("subtitle", fontName=FONT, fontSize=10, leading=17, textColor=MUTED, spaceAfter=15),
    "section": ParagraphStyle("section", fontName=FONT, fontSize=13, leading=20, textColor=BLUE, spaceBefore=17, spaceAfter=8),
    "body": ParagraphStyle("body", fontName=FONT, fontSize=10, leading=18, textColor=INK, spaceAfter=8),
    "small": ParagraphStyle("small", fontName=FONT, fontSize=8.5, leading=14, textColor=MUTED),
    "table": ParagraphStyle("table", fontName=FONT, fontSize=9, leading=15, textColor=INK),
    "table_head": ParagraphStyle("table_head", fontName=FONT, fontSize=9, leading=15, textColor=INK),
    "notice": ParagraphStyle("notice", fontName=FONT, fontSize=9, leading=16, textColor=BLUE, alignment=TA_CENTER),
}


def p(text, style="body"):
    return Paragraph(text, STYLE[style])


def table(headers, rows, widths=None):
    data = [[p(cell, "table_head") for cell in headers]]
    data += [[p(str(cell), "table") for cell in row] for row in rows]
    item = Table(data, colWidths=widths, hAlign="LEFT", repeatRows=1)
    item.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PALE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAFCFF")]),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return item


def section(title, *content):
    return [p(title, "section"), *content]


def page_decoration(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(BLUE)
    canvas.rect(0, height - 12 * mm, width, 12 * mm, fill=1, stroke=0)
    canvas.setFont(FONT, 8)
    canvas.setFillColor(colors.white)
    canvas.drawString(21 * mm, height - 8 * mm, "ReportAudit AI  /  公开演示资料")
    canvas.setFillColor(colors.HexColor("#DCE7F7"))
    canvas.setFont(FONT, 27)
    canvas.translate(width / 2, height / 2)
    canvas.rotate(28)
    canvas.drawCentredString(0, 0, "虚构样例 · 非真实项目")
    canvas.rotate(-28)
    canvas.translate(-width / 2, -height / 2)
    canvas.setStrokeColor(LINE)
    canvas.line(21 * mm, 19 * mm, width - 21 * mm, 19 * mm)
    canvas.setFont(FONT, 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(21 * mm, 13 * mm, "仅供软件界面展示，不作为鉴定、设计或施工依据")
    canvas.drawRightString(width - 21 * mm, 13 * mm, f"第 {doc.page} 页")
    canvas.restoreState()


def build(filename, title, subtitle, sections):
    OUTPUT.mkdir(parents=True, exist_ok=True)
    target = OUTPUT / filename
    doc = SimpleDocTemplate(
        str(target), pagesize=A4, rightMargin=21 * mm, leftMargin=21 * mm,
        topMargin=24 * mm, bottomMargin=26 * mm,
        title=title, author="ReportAudit AI - Fictional Sample",
        subject="Fictional public demonstration document; no real project data",
    )
    story = [p(title, "title"), p(subtitle, "subtitle"),
             table(["资料属性", "说明"], [
                 ["资料性质", "完全虚构的公开演示样例"],
                 ["项目代号", "DEMO-ONLY / 示例项目"],
                 ["使用限制", "仅用于软件操作演示；不得用于实际工程判断"],
             ], [36 * mm, 132 * mm]), Spacer(1, 5 * mm)]
    for index, (heading, content) in enumerate(sections):
        if heading == "__page_break__":
            story.append(PageBreak())
            continue
        story.append(p(heading, "section"))
        story.extend(content)
        if index != len(sections) - 1:
            story.append(Spacer(1, 2 * mm))
    story += [Spacer(1, 8 * mm), HRFlowable(width="100%", thickness=0.7, color=LINE),
              Spacer(1, 4 * mm), p("本资料由程序生成；无真实项目名称、地址、图纸、实测数据、签章或个人信息。", "notice")]
    doc.build(story, onFirstPage=page_decoration, onLaterPages=page_decoration)
    print(f"generated {target.name} ({target.stat().st_size} bytes)")


def house_docs():
    build("house-report.pdf", "房屋安全鉴定报告", "公开演示样例  /  文档编号 DEMO-H-RPT-001  /  版本 1.0", [
        ("一、项目概况", [p("对象为虚构的“示例房屋 A”。本报告只展示鉴定资料的章节结构与审核流转，不对应任何实际建筑。")]),
        ("二、鉴定范围", [p("演示范围包括资料完整性、构件外观记录、结构布置描述和结论表达。所有数量与描述均为占位示例。")]),
        ("三、资料与方法", [table(["资料类别", "演示内容", "核对结果"], [
            ["鉴定报告", "章节、附录和结论栏", "示例已填写"],
            ["计算书", "虚构参数与算式展示", "示例已填写"],
            ["原始文件", "现场记录样式", "示例已填写"],
        ], [34 * mm, 90 * mm, 44 * mm])]),
        ("四、演示性结论", [p("示例房屋 A 的结论栏仅用于演示审核页面中的定位、问题标注与报告预览。本文不提供真实安全等级或使用建议。")]),
    ])
    build("house-calculation.pdf", "房屋结构计算书", "公开演示样例  /  文档编号 DEMO-H-CAL-001  /  与示例房屋 A 对应", [
        ("一、计算目的", [p("展示计算书的输入、过程、结果及复核字段。下列数值没有工程来源，不可用于实际验算。")]),
        ("二、输入参数（虚构）", [table(["参数", "示例值", "备注"], [
            ["构件代号", "A-01", "虚构编号"], ["长度", "3.0 m", "演示占位值"],
            ["作用效应", "12.0 kN", "演示占位值"], ["校核阈值", "20.0 kN", "演示占位值"],
        ], [50 * mm, 42 * mm, 76 * mm])]),
        ("三、演示算式", [p("示例比值 = 12.0 / 20.0 = 0.60。该算式仅说明“输入—计算—复核”的文件排版，不构成结构设计或鉴定依据。")]),
    ])
    build("house-original.pdf", "房屋现场原始记录", "公开演示样例  /  文档编号 DEMO-H-RAW-001  /  与示例房屋 A 对应", [
        ("一、记录说明", [p("此表模拟现场记录的栏目组织。没有真实照片、平面图、构件位置或实测结果。")]),
        ("二、构件观察记录", [table(["序号", "部位代号", "观察项目", "演示记录"], [
            ["01", "A-01", "外观", "示例：记录栏已填写"],
            ["02", "A-02", "尺寸", "示例：未附实际测量"],
            ["03", "A-03", "连接", "示例：待正式项目核对"],
        ], [18 * mm, 31 * mm, 47 * mm, 72 * mm])]),
        ("三、资料交接", [p("演示附件清单：原始记录 1 份、计算书 1 份、鉴定报告 1 份。所有文件均为同组虚构样例。")]),
        ("四、记录声明", [p("本文件没有现场采集过程，不应推断任何实际建筑的状态。")]),
    ])


def curtain_docs():
    build("curtain-report.pdf", "幕墙安全鉴定报告", "公开演示样例  /  文档编号 DEMO-C-RPT-001  /  版本 1.0", [
        ("一、项目概况", [p("对象为虚构的“示例幕墙 B”。本文件用于演示报告提交、核查、问题查看和审核结果下发。")]),
        ("二、鉴定范围", [p("演示范围包括板块、支承构件、连接节点和维护记录等字段的呈现，不涉及实际工程图纸或现场数据。")]),
        ("三、资料核对", [table(["检查类别", "示例内容", "状态"], [
            ["构件信息", "名称与代号填写", "演示已填写"],
            ["连接节点", "检查项与备注栏", "演示已填写"],
            ["计算资料", "虚构计算书引用", "演示已填写"],
        ], [40 * mm, 83 * mm, 45 * mm])]),
        ("四、演示性结论", [p("本文的结论字段只作为系统界面中的占位内容。未依据任何实际幕墙进行检测、计算或安全评定。")]),
    ])
    build("curtain-calculation.pdf", "幕墙结构计算书", "公开演示样例  /  文档编号 DEMO-C-CAL-001  /  与示例幕墙 B 对应", [
        ("一、计算说明", [p("以下内容仅展示计算书的字段结构与引用关系，全部参数为虚构值。")]),
        ("二、输入参数（虚构）", [table(["字段", "示例值", "说明"], [
            ["构件代号", "B-01", "虚构编号"], ["面板尺寸", "1.2 × 1.5 m", "演示占位值"],
            ["作用值", "0.8 kN", "演示占位值"], ["校核值", "1.6 kN", "演示占位值"],
        ], [45 * mm, 47 * mm, 76 * mm])]),
        ("三、演示算式", [p("示例比值 = 0.8 / 1.6 = 0.50。该演示算式未采用真实材料参数、边界条件或规范计算方法。")]),
    ])
    build("curtain-original.pdf", "幕墙现场原始记录", "公开演示样例  /  文档编号 DEMO-C-RAW-001  /  与示例幕墙 B 对应", [
        ("一、记录说明", [p("此表仅模拟幕墙现场检查记录格式，不包含真实影像、照片、节点详图或检测值。")]),
        ("二、检查记录", [table(["序号", "代号", "检查项目", "演示记录"], [
            ["01", "B-01", "面板外观", "示例：待正式现场填写"],
            ["02", "B-02", "连接部位", "示例：待正式现场填写"],
            ["03", "B-03", "密封部位", "示例：待正式现场填写"],
        ], [18 * mm, 31 * mm, 47 * mm, 72 * mm])]),
        ("三、资料清单", [p("演示附件清单：原始记录 1 份、计算书 1 份、鉴定报告 1 份。三类文件对应同一虚构对象。")]),
        ("四、记录声明", [p("本记录未进行实际现场检测，不表达任何工程质量或安全判断。")]),
    ])


if __name__ == "__main__":
    house_docs()
    curtain_docs()
