<template>
  <plate-common ref="plateCommon" @togglePlate="togglePlate">
    <transition name="el-fade-in-linear">
      <score-result v-show="detailVisible" ref="scoreResult" :detail-visible.sync="detailVisible"></score-result>
    </transition>
    <transition name="el-fade-in-linear">
      <div v-show="!detailVisible" class="list-container">
        <div class="nav-tabs pb-20">
          <div class="nav-item is-active">考核验收</div>
          <div class="nav-item">试点遴选</div>
        </div>
        <div class="search-div">
          <span>考核年份：<el-date-picker v-model="searchForm.year" type="year" placeholder="请选择考核年份" value-format="yyyy" :clearable="false" style="width:170px" @change="queryData"></el-date-picker></span>
          <div class="search-div">
            <!-- <span class="plain-btn large" @click="toScore">指标评分</span> -->
            <!-- <el-button class="plain-btn large mr-5" @click="exportData">数据直接导出</el-button> -->
            <export-table :search-form="searchForm"></export-table>
            <el-button :disabled="notEntered" class="plain-btn large" @click="toScore">指标评分</el-button>
          </div>
        </div>
        <base-table
          v-loading="loading"
          :data="list"
          :columns="columns"
          :show-page="false"
          :reduce-height="reduceHeight"
        >
          <template v-slot:city="{scope}">
            {{ scope.row.areaCode | parseDictCode('AREA_CODE',true) }}
          </template>
          <template v-slot:ifIndexInput="{scope}">
            <span :class="scope.row.ifIndexInput === '1' ? 'text-green':'text-yellow'">{{ scope.row.ifIndexInput === '1' ? '已录入' : '未录入' }}</span>
          </template>
          <template v-slot:ifFinishGrade="{scope}">
            <span :class="scope.row.ifFinishGrade === '1' ? 'text-green':'text-yellow'">{{ scope.row.ifFinishGrade === '1' ? '已完成' : '未完成' }}</span>
          </template>
          <el-table-column label="操作" align="center" width="80">
            <template v-slot="{row}">
              <el-button type="text" @click="toDetail(row)">查看</el-button>
            </template>
          </el-table-column>
        </base-table>
      </div>
    </transition>
  </plate-common>
</template>

<script>
import PlateCommon from '../common-components/PlateCommon.vue'
import BaseTable from '@/shared/components/BaseTable/index.vue';
import ScoreResult from './components/ScoreResult.vue';
import exportTable from './components/exportTable.vue';
import { getAnnualPilotList, getKhIndexList, getEvaluationList } from '@/modules/services/index.service';
import { exportJsonToExcel } from '@/shared/utils/exportExcel';
import { getDictionariesByType } from '@/shared/utils/cache.utils';
export default {
  name: 'index-score',
  components: { PlateCommon, BaseTable, ScoreResult, exportTable },
  data() {
    return {
      activeName: 'first',
      reduceHeight: 170,
      columns: [
        { attrs: { label: '序号', type: 'index', width: 65 }},
        { attrs: { label: '试点名称', prop: 'pilotName' }},
        { attrs: { label: '地区', prop: 'city' }, slot: 'city' },
        { attrs: { label: '所属区县', prop: 'areaCode' }, dictType: 'AREA_CODE' },
        { attrs: { label: '所属批次', prop: 'batchTypeCode' }, dictType: 'BATCH_TYPE' },
        { attrs: { label: '指标录入', prop: 'ifIndexInput' }, slot: 'ifIndexInput' },
        { attrs: { label: '评分情况', prop: 'ifFinishGrade' }, slot: 'ifFinishGrade' }
      ],
      searchForm: {
        year: null,
        plateTypeCode: null
      },
      loading: false,
      detailInfo: {},
      detailVisible: false,
      list: [],
      exportDataList: [],
      tableHeader: { level3IndicatorsName: '指标项' }
    }
  },
  computed: {
    notEntered() {
      return this.list.some(item => item.ifIndexInput === '0')
    }
  },
  created() {
    this.$bus.$on('refreshScore', this.queryData)
    this.searchForm.year = new Date().getFullYear().toString()
  },
  mounted() {
    this.searchForm.plateTypeCode = this.$refs.plateCommon.code
    this.queryData()
  },
  methods: {
    // 获取列表数据
    queryData() {
      this.loading = true
      getAnnualPilotList(this.searchForm).then(res => {
        this.list = res.data || []
      }).finally(() => {
        this.loading = false
      })
    },
    // 切换板换
    togglePlate({ code }) {
      this.detailVisible = false
      this.searchForm.plateTypeCode = code
      this.queryData()
    },
    // 点击查看
    toDetail(item) {
      this.detailVisible = true
      this.$refs.scoreResult.initData({ ...item, ...this.searchForm })
    },
    // 评分
    toScore() {
      this.$router.push({
        name: 'indicator-score',
        query: this.searchForm
      })
    },
    //获取必要excel表格数据
    async getExcelData() {
      const indexRES = await getKhIndexList({ plateTypeCode: this.$refs.plateCommon.code, year: this.searchForm.year })
      const IndexData = indexRES.data
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
      const obj = {
        header: this.tableHeader,
        data: this.exportDataList,
        key: tableField,
        title: '',
        filename: `${this.searchForm.year}年度${area[0]}数据报表.xls`,
        autoWidth: true
      }
      exportJsonToExcel(obj)
    }
  }
}
</script>

<style lang="scss" scoped>
.search-div{
  padding-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
