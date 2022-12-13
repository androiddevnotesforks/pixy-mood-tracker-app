import { getLogEditMarginTop } from "@/helpers/responsive";
import { t } from "@/helpers/translation";
import useColors from "@/hooks/useColors";
import { useLogState } from "@/hooks/useLogs";
import { useTemporaryLog } from "@/hooks/useTemporaryLog";
import { getMostUsedEmotions } from "@/lib/utils";
import { Emotion } from "@/types";
import _ from "lodash";
import { useRef, useState } from "react";
import { Dimensions, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LinkButton from "../../../LinkButton";
import { SlideHeadline } from "../../components/SlideHeadline";
import { EMOTIONS } from "../../config";
import { Footer } from "../Footer";
import { EmotionAdvancedGradients } from "./EmotionAdvancedGradients";
import { EmotionAdvancedSelection } from "./EmotionAdvancedSelection";
import { EmotionBasicGradients } from "./EmotionBasicGradients";
import { EmotionBasicSelection } from "./EmotionBasicSelection";
import { ExpandButton } from "./ExpandButton";
import { Tooltip } from "./Tooltip";

export const WINDOW_WIDTH = Dimensions.get('window').width

type Mode = 'basic' | 'advanced'

export const SlideEmotions = ({
  defaultIndex,
  onDisableStep,
  onChange,
  showDisable,
}: {
  defaultIndex: number,
  onDisableStep: () => void,
  onChange: (emotions: Emotion[]) => void,
  showDisable: boolean,
}) => {
  const colors = useColors();
  const marginTop = getLogEditMarginTop()
  const insets = useSafeAreaInsets()
  const tempLog = useTemporaryLog()
  const logState = useLogState()

  const EMOTIONS_BY_KEY = _.keyBy(EMOTIONS, 'key')

  const initialSelectedEmotions = useRef(tempLog.data?.emotions?.map(d => EMOTIONS_BY_KEY[d]) || [])
  const [selectedEmotions, setSelectedEmotions] = useState<Emotion[]>(EMOTIONS.filter(d => tempLog.data?.emotions?.includes(d.key)))
  const [showTooltip, setShowTooltip] = useState(false)

  const _setSelectedEmotions = (emotions: Emotion[]) => {
    if (selectedEmotions.length < emotions.length) {
      setShowTooltip(true)
    } else {
      setShowTooltip(false)
    }
    setSelectedEmotions(emotions)
    onChange(emotions)
  }

  const [mode, setMode] = useState<Mode>('basic')

  const mostUsedEmotionKeys = getMostUsedEmotions(logState.items).map(d => d.key).slice(0, 20)
  const mostUsedEmotions = EMOTIONS.filter(d => mostUsedEmotionKeys.includes(d.key))
  const predefinedBasicEmotions = EMOTIONS
    .filter((e) => (
      e.mode === 'basic' &&
      e.disabled !== true
    ))

  let basicEmotions = initialSelectedEmotions.current

  if (basicEmotions.length < 20) {
    const missingEmotions = mostUsedEmotions
      .filter(d => !basicEmotions.map(d => d.key).includes(d.key))
      .slice(0, 20 - basicEmotions.length)

    basicEmotions = [
      ...basicEmotions,
      ...missingEmotions,
    ]
  }

  if (basicEmotions.length < 20) {
    const missingEmotions = predefinedBasicEmotions
      .filter(d => !basicEmotions.map(d => d.key).includes(d.key))
      .slice(0, 20 - basicEmotions.length)

    basicEmotions = [
      ...basicEmotions,
      ...missingEmotions,
    ]
  }

  basicEmotions = basicEmotions.map((emotion) => ({
    ...emotion,
    category: {
      very_bad: 'bad',
      bad: 'bad',
      neutral: 'neutral',
      good: 'good',
      very_good: 'good',
    }[emotion.category] as Emotion['category'],
  }))

  const toggleMode = () => {
    if (mode === 'basic') {
      setMode('advanced')
    } else {
      setMode('basic')
    }

    setShowTooltip(false)
    initialSelectedEmotions.current = selectedEmotions
  }

  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.logBackground,
      width: '100%',
      paddingBottom: insets.bottom + 20,
    }}>
      <View
        style={{
          flex: 1,
          position: 'relative',
        }}
      >
        <View
          style={{
            width: '100%',
            paddingHorizontal: 20,
            marginTop,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <SlideHeadline>{t('log_emotions_question')}</SlideHeadline>
          <ExpandButton
            expanded={mode === 'basic'}
            onPress={toggleMode}
          />
        </View>
        <View
          style={{
            position: 'relative',
            flex: 1,
          }}
        >
          <ScrollView>
            <EmotionBasicSelection
              emotions={basicEmotions}
              onPress={(emotion) => {
                if (selectedEmotions.map(d => d.key).includes(emotion.key)) {
                  _setSelectedEmotions(selectedEmotions.filter((e) => e.key !== emotion.key))
                } else {
                  _setSelectedEmotions([...selectedEmotions, emotion])
                }
              }}
              selectedEmotions={selectedEmotions}
              style={{
                display: mode === 'basic' ? 'flex' : 'none',
              }}
            />
            <EmotionAdvancedSelection
              defaultIndex={defaultIndex}
              onPress={(emotion) => {
                if (selectedEmotions.map(d => d.key).includes(emotion.key)) {
                  _setSelectedEmotions(selectedEmotions.filter((e) => e.key !== emotion.key))
                } else {
                  _setSelectedEmotions([...selectedEmotions, emotion])
                }
              }}
              selectedEmotions={selectedEmotions}
              style={{
                display: mode === 'advanced' ? 'flex' : 'none',
              }}
            />
          </ScrollView>
          {mode === 'basic' && <EmotionBasicGradients />}
          {mode === 'advanced' && <EmotionAdvancedGradients />}
          {showTooltip && (
            <Tooltip
              emotion={selectedEmotions[selectedEmotions.length - 1]}
              onClose={() => setShowTooltip(false)}
            />
          )}
        </View>
        <Footer
          style={{
            marginHorizontal: 16,
          }}
        >
          {showDisable && (
            <LinkButton
              type="secondary"
              onPress={onDisableStep}
              style={{
                fontWeight: '400',
              }}
            >{t('log_emotions_disable')}</LinkButton>
          )}
        </Footer>
      </View>
    </View>
  )
}