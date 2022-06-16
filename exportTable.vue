<template>
  <div>
    <el-button @click="exportTable">导出</el-button>
    <div v-show="false" id="exportDataReport">
      <table border="1">
        <tr>
          <th>指标项</th>
          <th v-for="item in contentData" :key="item.code" style="height: 30px;">
            {{ Object.values(item)[0].pilotName }}
          </th>
        </tr>
        <tr v-for="(item, index) in excelList" :key="index">
          <td style="height: 30px;text-align:center">{{ item.level3IndicatorsName }}</td>
          <td v-for="(score, scoreIndex) in titleList" :key="scoreIndex" style="text-align:center">{{ item[`score${scoreIndex}`] }}</td>
        </tr>

      </table>
    </div>
  </div>
</template>

<script>
import { getEvaluationList, getKhIndexList } from '@/modules/services/index.service';
import { exportTableToExcel } from '@/shared/utils/excel.utils';
import { getDictionariesByType } from '@/shared/utils/cache.utils';

export default {
  name: 'exportTable',
  inject: ['plateCommon'],
  props: {
    searchForm: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      titleData: [],
      contentData: [],
      excelList: [],
      titleList: []
    }
  },

  computed: {

  },

  created() {
    this.getData()

  },
  mounted() {

  },

  methods: {
    getData(searchForm) {
      // this.loading = true
      const p1 = getKhIndexList({ plateTypeCode: this.plateCommon.code, year: this.searchForm.year.toString() })
      const p2 = getEvaluationList(this.searchForm.year.toString(), this.plateCommon.code)
      Promise.all([p1, p2]).then(([p1Res, p2Res]) => {
        this.titleData = (p1Res.data || []).filter(item => item.indexLevel === 3)
        this.contentData = p2Res.data || []
        // console.log(this.titleData, '标题');
        // console.log(this.contentData, '分数');
        // 获取需要导出的试点名称（如：景德镇，古市镇）
        this.contentData.filter(item => { this.titleList.push(item['0ac838d4-272b-4351-8eaf-efb3d1c48bef'].pilotName) })
        // 创建每一组的指标数据（包括指标名称、还有indexId)
        this.titleData.map(item => this.excelList.push({ level3IndicatorsName: item.indexName, indexId: item.indexId }))
        // 动态填入每一组指标数据的“得分”
        this.excelList.filter((item, inx) => this.contentData.filter((val, index) => {
          for (const key in val) {
            if (val[key].indexId === item.indexId)
              this.excelList[inx][`score${index}`] = val[key].indexScore
          }
        }))
        // console.log(this.excelList, '列表');

        this.$nextTick()
      }).finally(() => {

      })
    },
    exportTable() {
      const area = getDictionariesByType('PLATE_TYPE').filter(item => item.code === this.plateCommon.code).map(item => item.name)
      exportTableToExcel('exportDataReport', `${this.searchForm.year}年度${area[0]}数据报表.xls`)
    }
  }
}
</script>

<style lang="less" scoped>

</style>
