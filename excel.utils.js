/**
 * Created by Zhangxx on 20/06/30
 */

import FileSaver from 'file-saver'
import XLSX from 'xlsx'
import XLSX_STYLE from 'xlsx-style'

/**
 * 基于export2Excel插件导出json数据
 * */
export function exportJsonToExcel(
  {
    multiHeader = [],
    header,
    list,
    filterVal,
    filename,
    merges = [],
    autoWidth = true,
    bookType = 'xlsx'
  } = {}
) {
  import('@/shared/vendor/Export2Excel').then(excel => {
    const data = formatJson(filterVal, list)
    excel.export_json_to_excel({
      multiHeader,
      header,
      data,
      filename,
      merges,
      autoWidth,
      bookType
    })
  })
}

/**
 * json格式转换
 * */
export function formatJson(filterVal, jsonData) {
  return jsonData.map(v => filterVal.map(j => {
    if (v[j] !== 0 && !v[j]) {
      v[j] = ''
    }
    return v[j]
  }))
}
/** 通过id导出excelTable
 * @param (String) id  表格外部包裹的div的id
 * @param (String) filaName 文件名
 * */
export function exportTableToExcel(id, filaName) {
  // 生成导出表格的html
  let export_html = document.getElementById(id).innerHTML
  export_html = export_html.replace(/data-type="string"/g, 'style="mso-number-format: @;"')
  const blob = new Blob([export_html], {
    type:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-16le'
  })
  FileSaver.saveAs(blob, `${filaName}`)
}
export function exportHtmlToExcel(tableHtml, filaName) {
  const blob = new Blob([tableHtml], {
    type:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-16le'
  })
  FileSaver.saveAs(blob, `${filaName}`)
}
export function exportTableHtmlToExcel(id, fileName) {
  const table = document.getElementById(id)
  // 以上四行也可以直接一行搞定，如果不需要对表格数据进行修改的话
  const workbook = XLSX.utils.table_to_book(table, { cellStyles: {}, raw: true })
  try {
    XLSX.writeFile(workbook, fileName)
  } catch (e) {
    console.log(e, workbook)
  }
}
export function exportTableArrToExcel(sheets = [], fileName) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ table, name }) => {
    const sheet = XLSX.utils.table_to_sheet(table, { cellStyles: { border: {}}, raw: true })
    const baseStyle = {
      /*     font: {
        sz: 10,
        color: {
          rgb: '00104E8B'
        }
      },*/
      border: { // 设置边框
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    }
    Object.keys(sheet).forEach(key => {
      if (key !== '!merges' && key !== '!rows' && key !== '!ref') {
        sheet[key].s = baseStyle
      }
    })
    XLSX.utils.book_append_sheet(wb, sheet, name);
  })
  try {
    // XLSX.writeFile(wb, fileName)
    var wbout = XLSX_STYLE.write(wb, {
      bookType: '',
      bookSST: false,
      type: 'binary'
    });
    FileSaver.saveAs(new Blob([s2ab(wbout)], {
      type: 'application/octet-stream'
    }), `${fileName}.xls`);
  } catch (e) {
    console.log(e, wb)
  }
}
function s2ab(s) {
  var buf = new ArrayBuffer(s.length);
  var view = new Uint8Array(buf);
  for (var i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
  return buf;
}
