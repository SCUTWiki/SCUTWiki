<script setup>
import Title from '../../components/Title.vue'
import WikiLayout from '../../components/WikiLayout.vue'
import scams from './content/scams.vue'
import EntryList from '../../components/entries/EntryList.vue'
import { useContentStats } from '../../composables/useContentStats'

const { entries } = useContentStats()
const moreEntries = entries.filter((entry) => entry.module === 'more')

const toc = [
  { id: 'entries', label: '词条' },
  { id: 'maxims', label: '箴言' },
  {id:'dangers', label:'常见风险', children:[
    {id:'scams', label:'诈骗'},
    {id:'others', label:'其他风险'}
  ]},
  {id:'misc', label:'杂文'}
]
</script>

<template>
  <Title />
  <h2>其他模块</h2>
  
  <p>杂文、群分享、兴趣爱好、箴言等等，内容建设中。</p>
  <WikiLayout :items="toc" :single="false">
    <h1>其他模块</h1>

    <section id="entries">
      <h2>词条</h2>
      <EntryList
        :entries="moreEntries"
        empty-text="往 src/content/more/ 里加 .md，就会出现在这里。"
      />
    </section>

    <section id="maxims" mode="switch">
      <h2>箴言</h2>
      <p>……</p>
    </section>
 
    <nav id="dangers">
      <h2>常见风险</h2>
      <section id="scams">
        <h3>诈骗</h3>
        <scams />
      </section>
      <section id="others">
        <h3>其他风险</h3>
        <p>……</p>
      </section>
    </nav>

    <section id="misc" mode="switch">
      <h2>杂文</h2>
      <p>……</p>
    </section>
  </WikiLayout>
</template>
