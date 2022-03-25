import dayjs from 'dayjs';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Platform, View } from 'react-native';
import { Trash2 } from 'react-native-feather';
import DismissKeyboard from '../components/DismisKeyboard';
import LinkButton from '../components/LinkButton';
import ModalHeader from '../components/ModalHeader';
import Scale from '../components/Scale';
import TextArea from '../components/TextArea';
import useColors from '../hooks/useColors';
import { LogItem, useLogs } from '../hooks/useLogs';
import { useSettings } from '../hooks/useSettings';
import { useTranslation } from '../hooks/useTranslation';
import { RootStackScreenProps } from '../types';
import { debounce } from "lodash";
import { useSegment } from '../hooks/useSegment';
import Button from '../components/Button';

export default function Log({ navigation, route }: RootStackScreenProps<'Log'>) {
  
  const { settings } = useSettings()
  const colors = useColors()
  const i18n = useTranslation()
  const segment = useSegment()
  
  const defaultLogItem: LogItem = {
    date: route.params.date,
    rating: 'neutral',
    message: '',
  };

  const { state, dispatch } = useLogs()

  const existingLogItem = state?.items[route.params.date];
  const [logItem, setLogItem] = useState<LogItem>(existingLogItem || defaultLogItem)

  const save = () => {
    segment.track('log_saved')
    dispatch({
      type: existingLogItem ? 'edit' : 'add',
      payload: logItem
    })
    navigation.navigate('Calendar');
  }

  const remove = () => {
    segment.track('log_deleted')
    dispatch({
      type: 'delete', 
      payload: logItem
    })
    navigation.navigate('Calendar');
  }

  const cancel = () => {
    segment.track('log_cancled')
    setLogItem(defaultLogItem)
    navigation.navigate('Calendar');
  }

  const trackMessageChange = useCallback(debounce(() => {
    segment.track('log_message_changed')
  }, 1000), []);

  const setRating = (rating: LogItem['rating']) => setLogItem(logItem => ({ ...logItem, rating }))
  const setMessage = (message: LogItem['message']) => {
    trackMessageChange()
    setLogItem(logItem => ({ ...logItem, message }))
  }
  
  return (
    <DismissKeyboard>
    <View style={{
      flex: 1,
      justifyContent: 'flex-start',
      backgroundColor: colors.background,
      paddingTop: 20,
      paddingBottom: 20,
      paddingLeft: 20,
      paddingRight: 20,
    }}>
      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar animated={true} style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      <ModalHeader
        title={dayjs(route.params.date).format('ddd, L')}
        right={<Button testID='modal-submit' onPress={save}>{existingLogItem ? i18n.t('save') : i18n.t('add')}</Button>}
        left={<LinkButton testID='modal-cancel' onPress={cancel} type='secondary'>{i18n.t('cancel')}</LinkButton>}
      />
      <View
        style={{
          width: '100%',
        }}
      >
        <Scale
          type={settings.scaleType}
          value={logItem.rating}
          onPress={setRating}
        />
      </View>
      <TextArea 
        testID='modal-message'
        onChange={setMessage}
        placeholder={i18n.t('log_modal_message_placeholder')}
        value={logItem.message} 
        maxLength={512}
        autoFocus
      />
      {existingLogItem && (
        <View
          style={{
            marginTop: 20,
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <LinkButton 
            onPress={remove} 
            type='secondary' 
            icon={<Trash2 width={16} color={colors.secondaryLinkButtonText} />}
            testID='modal-delete'
          >{i18n.t('delete')}</LinkButton>
        </View>
      )}
    </View>
    </DismissKeyboard>
  );
}