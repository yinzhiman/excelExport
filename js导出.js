//获取必要excel表格数据
    async getExcelData() {
      const indexRES = await getKhIndexList({ plateTypeCode: this.$refs.plateCommon.code, year: this.searchForm.year })
      const IndexData = indexRES.data
      this.exportDataList ? this.exportDataList = [] : ''
      // 创建每一组的指标数据（包括指标名称、还有indexId)
      IndexData.filter(item => item.indexLevel === 3).map(item => this.exportDataList.push({ level3IndicatorsName: item.indexName, indexId: item.indexId }))
      const scoreRES = await getEvaluationList(this.searchForm.year, this.$refs.plateCommon.code)
      const scoreData = scoreRES.data
      // 获取需要导出的试点名称（如：景德镇，古市镇）
      scoreData.filter((item, index) => { this.tableHeader[`score${index}`] = item[Object.keys(item)[0]].pilotName })
      // 动态填入每一组指标数据的“得分”
      this.exportDataList.filter((item, index) => scoreData.filter((val, inx) => {
        for (const key in val)
          if (val[key].indexId === item.indexId)
            this.exportDataList[index][`score${inx}`] = val[key].indexScore
      }))
      // 清空indexId
      this.exportDataList = this.exportDataList.filter(item => delete item.indexId)
      // 插入总分
      const totalOBJ = {
        level3IndicatorsName: '总分'
      }
      for (let i = 0; i < scoreData.length; i++) {
        let num = 0
        this.exportDataList.map((item) => {
          num = (num + item[`score${i}`]).toFixed(2) * 100 / 100
        })
        totalOBJ[`score${i}`] = num
      }
      this.exportDataList.push(totalOBJ)
    },

    //导出数据
    async exportData() {
      // 用例https://juejin.cn/post/7086879982768783391#heading-12
      await this.getExcelData()
      const tableField = []
      for (const key in this.tableHeader) {
        tableField.push(key)
      }
      const area = getDictionariesByType('PLATE_TYPE').filter(item => item.code === this.$refs.plateCommon.code).map(item => item.name)
      const obj = {}
      obj.header = this.tableHeader
      obj.data = this.exportDataList
      obj.key = tableField
      obj.title = ''
      obj.filename = `${this.searchForm.year}年度${area[0]}数据报表`
      obj.autoWidth = true
      exportJsonToExcel(obj)
    }
