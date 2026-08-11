import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Globe2, TrendingUp, Anchor, CheckCircle2, ArrowRight, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useContentBlocks, useSiteSetting } from '@/hooks/use-cms';
import { getPrimaryLanguage } from '@/lib/i18n-utils';
import type { CmsJsonObject, CmsLocale, ContentBlockView } from '@/lib/cms-types';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

function text(block: ContentBlockView | undefined, key: string) {
  const value = block?.content[key]
  return typeof value === 'string' ? value : null
}

function CmsState({ message }: Readonly<{ message: string }>) {
  return (
    <output className="block min-h-screen bg-[#0a0a0a] px-6 pt-32 text-center text-white">
      <p>{message}</p>
    </output>
  )
}

export function LandingPage() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const { t, i18n } = useTranslation();
  const locale = getPrimaryLanguage(i18n.resolvedLanguage ?? i18n.language) as CmsLocale
  const blocksQuery = useContentBlocks('landing', locale)
  const mediaQuery = useSiteSetting('media.landing')
  const blocks = blocksQuery.data
  const hero = blocks.find((block) => block.section === 'hero' && block.key === 'main')
  const countriesIntro = blocks.find((block) => block.section === 'countries' && block.key === 'intro')
  const countries = blocks.filter((block) => block.section === 'countries' && block.key !== 'intro')
  const featuresIntro = blocks.find((block) => block.section === 'features' && block.key === 'intro')
  const features = blocks.filter((block) => block.section === 'features' && block.key !== 'intro')
  const live = blocks.find((block) => block.section === 'live' && block.key === 'main')
  const media = mediaQuery.data?.value as CmsJsonObject | undefined
  const heroImage = typeof media?.hero === 'string' ? media.hero : null

  if (blocksQuery.loading || mediaQuery.loading) return <CmsState message={t('common.loading')} />
  if (blocksQuery.error || mediaQuery.error) return <CmsState message={t('common.error')} />
  if (!hero || !countriesIntro || !featuresIntro || !live || !heroImage || countries.length === 0 || features.length === 0) {
    return <CmsState message={locale === 'fr' ? 'Contenu temporairement indisponible.' : 'Content temporarily unavailable.'} />
  }

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen overflow-x-hidden font-sans">
      {/* CEMAC FLAGS TOP RIBBON */}
      <div className="flex w-full h-1.5 z-[100] fixed top-0 left-0 opacity-90">
        <div className="flex-1 bg-gradient-to-r from-green-600 via-red-500 to-yellow-500" title="Cameroun" />
        <div className="flex-1 bg-gradient-to-r from-green-500 via-yellow-400 to-blue-600" title="Gabon" />
        <div className="flex-1 bg-gradient-to-br from-green-500 via-yellow-400 to-red-500" title="Congo" />
        <div className="flex-1 bg-gradient-to-b from-green-600 via-white to-red-600 border-l border-blue-500" title="Guinée Équatoriale" />
        <div className="flex-1 bg-gradient-to-r from-blue-700 via-yellow-400 to-red-600" title="Tchad" />
        <div className="flex-1 bg-gradient-to-r from-blue-600 via-white to-green-600 border-b border-red-500 relative" title="Centrafrique">
           <div className="absolute top-0 right-0 w-full h-[1px] bg-yellow-400" />
        </div>
      </div>
      
      {/* HERO SECTION 4K + 3D PARALLAX */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden" aria-label="Accueil">
        <motion.div style={{ y }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20 z-10" />
          <img 
            src={heroImage}
            alt={text(hero, 'image_alt') ?? ''}
            loading="lazy"
            className="w-full h-full object-cover scale-105"
          />
        </motion.div>

        <div className="container relative z-20 mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-8 mt-16 md:mt-0">
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" aria-hidden />
              <span className="text-sm font-medium tracking-wider uppercase">{text(hero, 'badge')}</span>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500">
              {text(hero, 'title')}
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-gray-300 max-w-xl leading-relaxed">
              {text(hero, 'description')}
            </motion.p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto bg-green-700 hover:bg-green-800 text-white px-8 py-6 text-lg rounded-full shadow-[0_0_40px_rgba(22,163,74,0.4)] transition-all hover:scale-105">
                <Link to="/auth/register">
                  {text(hero, 'primary_cta')} <ArrowRight className="ml-2 w-5 h-5" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg rounded-full border-white/20 hover:bg-white/10 text-white backdrop-blur-md bg-white/5">
                <Link to="/auth/login">
                  {text(hero, 'secondary_cta')}
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* 3D FLOATING ELEMENTS CARD */}
          <motion.div 
            initial={{ opacity: 0, x: 100, rotateY: -20, rotateX: 10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0, rotateX: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="hidden md:block relative perspective-[1000px] mt-16"
            aria-label={text(live, 'aria_label') ?? undefined}
          >
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10 transform-gpu hover:rotate-y-[-5deg] hover:rotate-x-[5deg] transition-transform duration-500">
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
                <div>
                  <h3 className="text-2xl font-semibold text-white">{text(live, 'title')}</h3>
                  <p className="text-green-400 text-sm mt-1 flex items-center gap-1"><Activity className="w-4 h-4" aria-hidden/> {text(live, 'status')}</p>
                </div>
                <Globe2 className="w-12 h-12 text-white/20" aria-hidden />
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                        <Anchor className="w-5 h-5" aria-hidden />
                      </div>
                      <div>
                        <p className="font-medium text-white">{text(live, 'item_label')} {i}</p>
                        <p className="text-xs text-gray-400">{text(live, 'item_status')}</p>
                      </div>
                    </div>
                    <CheckCircle2 className="text-green-400 w-5 h-5" aria-hidden />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Ambient glows behind the card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-green-500/20 blur-[100px] z-0 pointer-events-none rounded-full" aria-hidden />
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/30 blur-[80px] z-0 pointer-events-none rounded-full" aria-hidden />
          </motion.div>
        </div>
      </section>

      {/* CEMAC SHOWCASE */}
      <section className="py-24 bg-zinc-950 relative" aria-label="Nations de la CEMAC">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">{text(countriesIntro, 'title')}</h2>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">{text(countriesIntro, 'description')}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {countries.map((country, idx) => (
              <motion.div
                key={country.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="group relative h-72 rounded-2xl overflow-hidden cursor-pointer focus-within:ring-2 focus-within:ring-green-500"
                tabIndex={0}
                aria-label={`${text(country, 'name') ?? ''} : ${text(country, 'description') ?? ''}`}
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-500 z-10" />
                <img 
                  src={country.mediaUrl ?? ''}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                  <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <span className="text-3xl" aria-hidden>{text(country, 'flag')}</span> {text(country, 'name')}
                  </h3>
                  <p className="text-gray-300 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 transition-all duration-300">
                    {text(country, 'description')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* IMMERSIVE STATS / B2B */}
      <section className="py-24 relative overflow-hidden bg-black border-t border-white/5" aria-label="Avantages clés">
         <div className="absolute top-1/2 left-1/4 w-[800px] h-[800px] bg-green-900/10 blur-[150px] rounded-full pointer-events-none transform -translate-y-1/2" aria-hidden />
         
         <div className="container relative z-10 mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">{text(featuresIntro, 'title')}</span>
                </h2>
                <div className="space-y-6">
                  {features.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                        <TrendingUp className="text-green-500 w-6 h-6" aria-hidden />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-white">{text(item, 'title')}</h4>
                        <p className="text-gray-400">{text(item, 'description')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* 3D Dashboard Mockup */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
                whileInView={{ opacity: 1, scale: 1, rotateY: -10 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="relative perspective-[1500px] hidden sm:block"
                aria-hidden="true"
              >
                <div className="bg-[#0f1115] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl p-4">
                   <div className="flex items-center gap-2 mb-4 px-2">
                     <div className="w-3 h-3 rounded-full bg-red-500" />
                     <div className="w-3 h-3 rounded-full bg-yellow-500" />
                     <div className="w-3 h-3 rounded-full bg-green-500" />
                   </div>
                   <div className="grid grid-cols-3 gap-4">
                     <div className="col-span-1 border border-gray-800 rounded-xl p-4 bg-white/[0.02]">
                       <div className="h-4 w-1/2 bg-gray-800 rounded mb-4" />
                       <div className="space-y-2">
                         <div className="h-2 w-full bg-gray-800 rounded" />
                         <div className="h-2 w-4/5 bg-gray-800 rounded" />
                         <div className="h-2 w-full bg-gray-800 rounded" />
                       </div>
                     </div>
                     <div className="col-span-2 border border-gray-800 rounded-xl p-4 bg-white/[0.02]">
                       <div className="h-32 w-full bg-gradient-to-t from-green-500/20 to-transparent border-b border-green-500 rounded relative">
                          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-green-500" />
                       </div>
                     </div>
                     <div className="col-span-3 border border-gray-800 rounded-xl p-4 bg-white/[0.02] flex justify-between">
                       <div className="h-4 w-32 bg-gray-800 rounded" />
                       <div className="h-4 w-16 bg-green-500/50 rounded" />
                     </div>
                   </div>
                </div>
              </motion.div>
            </div>
         </div>
      </section>

    </div>
  )
}

