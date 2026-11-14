<script setup>
import { computed } from 'vue'

const props = defineProps({
  contact: { type: Object, required: true },
  favorited: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-favorite', 'copy'])
const phoneNumbers = computed(() => {
  const numbers = [...(props.contact.phones ?? [])]
  const singlePhone = props.contact.phone || props.contact.officePhone
  if (singlePhone && !numbers.includes(singlePhone)) numbers.push(singlePhone)
  return numbers
})
</script>

<template>
  <article class="contact-card">
    <header class="card-heading">
      <div>
        <h3>{{ contact.name || contact.college }}</h3>
        <p class="organization">{{ contact.college || contact.organization }}</p>
      </div>
      <button
        class="favorite-button"
        type="button"
        :aria-label="favorited ? `取消收藏${contact.name || contact.college}` : `收藏${contact.name || contact.college}`"
        :aria-pressed="favorited"
        @click="emit('toggle-favorite', contact)"
      >
        <span aria-hidden="true">{{ favorited ? '★' : '☆' }}</span>
      </button>
    </header>

    <p v-if="contact.researchDirection || contact.description" class="description">
      {{ contact.researchDirection || contact.description }}
    </p>
    <dl class="contact-details">
      <div v-if="phoneNumbers.length">
        <dt>电话</dt>
        <dd>
          <span v-for="phone in phoneNumbers" :key="phone">
            <a :href="`tel:${phone}`">{{ phone }}</a>
            <button type="button" @click="emit('copy', phone, '电话号码')">复制</button>
          </span>
        </dd>
      </div>
      <div v-if="contact.email">
        <dt>邮箱</dt>
        <dd>
          <a :href="`mailto:${contact.email}`">{{ contact.email }}</a>
          <button type="button" @click="emit('copy', contact.email, '邮箱')">复制</button>
        </dd>
      </div>
      <div v-if="contact.profileUrl">
        <dt>个人主页</dt>
        <dd>
          <a :href="contact.profileUrl" target="_blank" rel="noopener noreferrer">打开主页 ↗</a>
          <button type="button" @click="emit('copy', contact.profileUrl, '网址')">复制</button>
        </dd>
      </div>
      <div v-if="contact.website">
        <dt>官方网站</dt>
        <dd>
          <a :href="contact.website" target="_blank" rel="noopener noreferrer">{{ contact.website }}</a>
          <button type="button" @click="emit('copy', contact.website, '网址')">复制</button>
        </dd>
      </div>
      <div v-if="contact.qqGroups?.length">
        <dt>新生QQ群</dt>
        <dd>
          <span v-for="group in contact.qqGroups" :key="typeof group === 'string' ? group : group.number">
            {{ typeof group === 'string' ? group : `${group.label}：${group.number}` }}
          </span>
          <button
            v-for="group in contact.qqGroups"
            :key="`copy-${typeof group === 'string' ? group : group.number}`"
            type="button"
            @click="emit('copy', typeof group === 'string' ? group : group.number, 'QQ群号')"
          >
            复制 {{ typeof group === 'string' ? group : group.number }}
          </button>
        </dd>
      </div>
      <div v-if="contact.sourceUrl || contact.source">
        <dt>信息来源</dt>
        <dd>
          <a
            v-if="contact.sourceUrl"
            :href="contact.sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            官方来源 ↗
          </a>
          <span v-else>{{ contact.source }}</span>
          <button
            v-if="contact.sourceUrl"
            type="button"
            @click="emit('copy', contact.sourceUrl, '来源网址')"
          >
            复制
          </button>
        </dd>
      </div>
    </dl>
    <p v-if="contact.validity" class="validity">{{ contact.validity }}</p>
    <slot name="footer" />
  </article>
</template>

<style scoped>
.contact-card {
  min-width: 0;
  padding: 1.15rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background);
  box-shadow: 0 4px 16px rgba(20, 40, 35, 0.035);
}

.card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

h3 {
  color: var(--color-heading);
  font-size: 1.05rem;
  font-weight: 650;
  overflow-wrap: anywhere;
}

.organization {
  margin-top: 0.25rem;
  color: var(--color-text);
  font-size: 0.9rem;
  opacity: 0.7;
}

.favorite-button {
  flex: 0 0 auto;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: transparent;
  color: #d3a62d;
  font-size: 1.25rem;
  cursor: pointer;
}

.favorite-button:hover {
  border-color: #d3a62d;
}

.description {
  margin-top: 0.85rem;
  line-height: 1.7;
}

.contact-details {
  display: grid;
  gap: 0.55rem;
  margin-top: 0.9rem;
}

.contact-details > div {
  display: grid;
  grid-template-columns: 4.5rem minmax(0, 1fr);
  gap: 0.45rem;
}

dt {
  opacity: 0.65;
}

dd {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.65rem;
  min-width: 0;
  overflow-wrap: anywhere;
}

dd a,
.text-action {
  color: hsla(160, 100%, 37%, 1);
}

dd button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: 0.82rem;
  text-decoration: underline;
  text-underline-offset: 0.15em;
  cursor: pointer;
  opacity: 0.72;
}

.validity {
  margin-top: 0.85rem;
  padding-top: 0.7rem;
  border-top: 1px solid var(--color-border);
  font-size: 0.82rem;
  opacity: 0.65;
}
</style>
